'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number; userId: string; assetName: string; assetType: string
  subCategory: string | null; action: 'Buy' | 'Sell'
  units: number; price: number; date: string; notes: string | null; createdAt: string
}
interface EnrichedTx extends Transaction { cashFlow: number; pnl: number | null; taxTag: 'STCG' | 'LTCG' | null }
interface HoldingRow {
  name: string; assetType: string; units: number; avgBuyPrice: number
  totalInvested: number; realizedPnL: number; firstBuyDate: string
}
interface Summary { totalInvested: number; totalRecovered: number; realizedPnL: number; netDeployed: number; count: number }
interface TaxSummary { stcgEquity: number; ltcgEquity: number; debtOther: number }

// ── Constants ────────────────────────────────────────────────────────────────
const ASSET_TYPES = [
  'DIRECT EQUITY', 'MUTUAL FUNDS', 'ETF', 'DEBT MUTUAL FUNDS',
  'FD', 'PPF', 'NSC', 'INSURANCE', 'GOLD - PHYSICAL', 'REAL ESTATE', 'BUSINESS FUNDS',
]
const UNITLESS_TYPES = new Set(['FD', 'PPF', 'NSC', 'INSURANCE', 'REAL ESTATE', 'BUSINESS FUNDS'])
const EQUITY_TYPES  = new Set(['DIRECT EQUITY', 'MUTUAL FUNDS', 'ETF'])
const DEBT_TYPES    = new Set(['DEBT MUTUAL FUNDS', 'FD', 'PPF', 'NSC'])

const UNITS_LABEL: Record<string, string> = {
  'DIRECT EQUITY': 'Shares', 'MUTUAL FUNDS': 'Units', 'ETF': 'Units',
  'DEBT MUTUAL FUNDS': 'Units', 'GOLD - PHYSICAL': 'Weight (grams)',
}
const PRICE_LABEL: Record<string, string> = {
  'DIRECT EQUITY': 'Price per Share (₹)', 'MUTUAL FUNDS': 'NAV (₹)',
  'ETF': 'Price per Unit (₹)', 'DEBT MUTUAL FUNDS': 'NAV (₹)',
  'GOLD - PHYSICAL': 'Price per gram (₹)', 'FD': 'Amount Invested (₹)',
  'PPF': 'Amount (₹)', 'NSC': 'Amount (₹)', 'INSURANCE': 'Premium / Amount (₹)',
  'REAL ESTATE': 'Total Investment (₹)', 'BUSINESS FUNDS': 'Capital Deployed (₹)',
}
const ACTION_LABELS: Record<string, [string, string]> = {
  'FD': ['Invest', 'Withdraw'], 'PPF': ['Invest', 'Withdraw'],
  'NSC': ['Invest', 'Redeem'], 'INSURANCE': ['Pay Premium', 'Claim'],
  'REAL ESTATE': ['Invest', 'Sell'], 'BUSINESS FUNDS': ['Invest', 'Withdraw'],
}
const CHART_COLORS = [
  '#059669','#10b981','#34d399','#6ee7b7',
  '#0ea5e9','#38bdf8','#a78bfa','#f59e0b','#f87171','#fb923c','#e879f9',
]
const EMPTY_FORM = {
  assetName: '', assetType: 'DIRECT EQUITY', subCategory: '', action: 'Buy' as 'Buy' | 'Sell',
  units: '', price: '', date: new Date().toISOString().slice(0, 10), notes: '',
}

// ── Formatters ───────────────────────────────────────────────────────────────
function fmtInr(v: number): string {
  const abs = Math.abs(v); const sign = v < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)}K`
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}
function monthKey(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y.slice(2)}`
}
function holdingAge(firstBuyDate: string): string {
  const days = Math.floor((Date.now() - new Date(firstBuyDate).getTime()) / 86400000)
  if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`
  if (days >= 30)  return `${Math.floor(days / 30)}m`
  return `${days}d`
}
function daysBetween(d1: string, d2: string): number {
  return Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000)
}

// ── Light theme — aligned with DhanVeda #F0FDF4 layout background ─────────
const T = {
  bg:          '#ffffff',
  bgLight:     '#f0fdf4',
  border:      'rgba(5,150,105,0.2)',
  borderFaint: 'rgba(5,150,105,0.08)',
  accent:      '#059669',
  accentBr:    '#10b981',
  text:        '#064E3B',
  textSec:     '#374151',
  textMut:     '#6B7280',
  green:       '#059669',
  red:         '#DC2626',
  amber:       '#D97706',
  tooltipBg:   '#ffffff',
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 12px rgba(5,150,105,0.12)',
}

// ── P&L + tax + holding-period calculation ───────────────────────────────────
function calcPortfolio(txns: Transaction[]) {
  const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const state: Record<string, {
    totalUnits: number; totalCost: number; realizedPnL: number
    assetType: string; firstBuyDate: string
  }> = {}
  const taxSummary: TaxSummary = { stcgEquity: 0, ltcgEquity: 0, debtOther: 0 }

  const enriched: EnrichedTx[] = sorted.map(t => {
    if (!state[t.assetName]) {
      state[t.assetName] = { totalUnits: 0, totalCost: 0, realizedPnL: 0, assetType: t.assetType, firstBuyDate: t.date }
    }
    const s = state[t.assetName]
    let pnl: number | null = null
    let taxTag: 'STCG' | 'LTCG' | null = null

    if (t.action === 'Buy') {
      s.totalUnits += t.units
      s.totalCost  += t.units * t.price
    } else {
      const avgBuy = s.totalUnits > 0 ? s.totalCost / s.totalUnits : 0
      pnl = (t.price - avgBuy) * t.units
      s.realizedPnL += pnl
      s.totalCost   -= avgBuy * Math.min(t.units, s.totalUnits)
      s.totalUnits   = Math.max(0, s.totalUnits - t.units)
      const holdDays   = daysBetween(s.firstBuyDate, t.date)
      const isDebt     = DEBT_TYPES.has(t.assetType) || !EQUITY_TYPES.has(t.assetType)
      taxTag = holdDays >= (isDebt ? 1095 : 365) ? 'LTCG' : 'STCG'
      if (EQUITY_TYPES.has(t.assetType)) {
        if (taxTag === 'STCG') taxSummary.stcgEquity += pnl
        else                   taxSummary.ltcgEquity += pnl
      } else {
        taxSummary.debtOther += pnl
      }
    }
    return { ...t, cashFlow: t.action === 'Buy' ? -(t.units * t.price) : t.units * t.price, pnl, taxTag }
  })

  const totalInvested  = enriched.filter(t => t.action === 'Buy').reduce((s, t) => s + t.units * t.price, 0)
  const totalRecovered = enriched.filter(t => t.action === 'Sell').reduce((s, t) => s + t.units * t.price, 0)
  const realizedPnL    = Object.values(state).reduce((s, a) => s + a.realizedPnL, 0)

  const holdings: HoldingRow[] = Object.entries(state)
    .filter(([, s]) => s.totalUnits > 0.0001)
    .map(([name, s]) => ({
      name, assetType: s.assetType, units: s.totalUnits,
      avgBuyPrice: s.totalUnits > 0 ? s.totalCost / s.totalUnits : 0,
      totalInvested: s.totalCost, realizedPnL: s.realizedPnL, firstBuyDate: s.firstBuyDate,
    }))

  const summary: Summary = { totalInvested, totalRecovered, realizedPnL, netDeployed: totalInvested - totalRecovered, count: txns.length }
  return { enriched: enriched.slice().reverse(), holdings, summary, state, taxSummary }
}

// ── Risk Meter ───────────────────────────────────────────────────────────────
function RiskMeter({ holdings }: { holdings: HoldingRow[] }) {
  if (!holdings.length) return null
  const total  = holdings.reduce((s, h) => s + h.totalInvested, 0)
  if (!total) return null
  const equity = holdings.filter(h => EQUITY_TYPES.has(h.assetType)).reduce((s, h) => s + h.totalInvested, 0)
  const debt   = holdings.filter(h => DEBT_TYPES.has(h.assetType)).reduce((s, h) => s + h.totalInvested, 0)
  const alt    = total - equity - debt
  const eqPct  = equity / total
  const label  = eqPct > 0.7 ? 'Aggressive' : eqPct > 0.5 ? 'Moderate–High' : eqPct > 0.3 ? 'Moderate' : eqPct > 0.1 ? 'Conservative–Moderate' : 'Conservative'
  const color  = eqPct > 0.7 ? T.red : eqPct > 0.5 ? T.amber : T.green
  const segs = [
    { label: 'Equity', pct: Math.round((equity / total) * 100), color: '#059669' },
    { label: 'Debt',   pct: Math.round((debt   / total) * 100), color: '#0ea5e9' },
    { label: 'Alt',    pct: Math.round((alt    / total) * 100), color: '#a78bfa' },
  ].filter(s => s.pct > 0)
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Risk Profile</div>
          <div style={{ fontSize: 11, color: T.textMut }}>Based on your allocation mix</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: '4px 10px', borderRadius: 20, border: `1px solid ${color}40` }}>{label}</span>
      </div>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 10, marginBottom: 10, gap: 2 }}>
        {segs.map(s => <div key={s.label} style={{ flex: s.pct, background: s.color, minWidth: 4 }} />)}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: 11, color: T.textSec }}>{s.label} {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
function TxModal({ initial, onSave, onClose, saving, saveError }: {
  initial: typeof EMPTY_FORM; onSave: (f: typeof EMPTY_FORM) => void
  onClose: () => void; saving: boolean; saveError?: string
}) {
  const [f, setF] = useState(initial)
  const set = (k: keyof typeof EMPTY_FORM, v: string) => setF(p => ({ ...p, [k]: v }))

  const isUnitless = UNITLESS_TYPES.has(f.assetType)
  const unitsLabel = UNITS_LABEL[f.assetType] ?? 'Units'
  const priceLabel = PRICE_LABEL[f.assetType] ?? 'Price per Unit (₹)'
  const [buyLabel, sellLabel] = ACTION_LABELS[f.assetType] ?? ['Buy', 'Sell']
  const cashFlowAmt = isUnitless
    ? parseFloat(f.price || '0')
    : parseFloat(f.units || '0') * parseFloat(f.price || '0')
  const canSave = !!(f.assetName && f.price && f.date && (isUnitless || f.units))

  function handleSave() {
    if (!canSave) return
    const out = { ...f }
    if (isUnitless) out.units = '1'
    onSave(out)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.bgLight,
    color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 11, color: T.textSec, display: 'block', marginBottom: 4, fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(5,150,105,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: T.text, fontSize: 16, fontWeight: 700 }}>
            {initial.assetName ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMut, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Action toggle */}
        <div style={{ display: 'flex', background: T.bgLight, borderRadius: 10, padding: 3, marginBottom: 18, border: `1px solid ${T.border}` }}>
          {(['Buy', 'Sell'] as const).map(a => (
            <button key={a} onClick={() => set('action', a)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              background: f.action === a ? (a === 'Buy' ? T.green : T.red) : 'transparent',
              color: f.action === a ? '#fff' : T.textMut,
            }}>{a === 'Buy' ? buyLabel : sellLabel}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Asset Name *</label>
            <input value={f.assetName} onChange={e => set('assetName', e.target.value)}
              placeholder="e.g. Reliance Industries" style={inp} />
          </div>
          <div>
            <label style={lbl}>Asset Type *</label>
            <select value={f.assetType} onChange={e => set('assetType', e.target.value)}
              style={{ ...inp, background: T.bg }}>
              {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Sub-Category</label>
            <input value={f.subCategory} onChange={e => set('subCategory', e.target.value)}
              placeholder={f.assetType === 'MUTUAL FUNDS' ? 'e.g. Large Cap' : f.assetType === 'INSURANCE' ? 'e.g. Term / ULIP' : 'Optional'}
              style={inp} />
          </div>
          {!isUnitless && (
            <div>
              <label style={lbl}>{unitsLabel} *</label>
              <input type="number" value={f.units} onChange={e => set('units', e.target.value)} placeholder="0" style={inp} />
            </div>
          )}
          <div style={isUnitless ? { gridColumn: '1/-1' } : {}}>
            <label style={lbl}>{priceLabel} *</label>
            <input type="number" value={f.price} onChange={e => set('price', e.target.value)} placeholder="0" style={inp} />
          </div>
          <div>
            <label style={lbl}>Date *</label>
            <input type="date" value={f.date} onChange={e => set('date', e.target.value)}
              style={{ ...inp, colorScheme: 'light' } as React.CSSProperties} />
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional remarks" style={inp} />
          </div>
        </div>

        {cashFlowAmt > 0 && (
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 14, padding: '8px 12px', background: T.bgLight, borderRadius: 8, border: `1px solid ${T.border}` }}>
            Cash flow: <strong style={{ color: f.action === 'Buy' ? T.red : T.green }}>
              {f.action === 'Buy' ? '-' : '+'}{fmtInr(cashFlowAmt)}
            </strong>
          </div>
        )}

        {saveError && (
          <div style={{ fontSize: 12, color: T.red, marginBottom: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>
            ⚠ {saveError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgLight, color: T.textSec, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !canSave}
            style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving || !canSave ? 0.5 : 1, boxShadow: T.shadowMd }}>
            {saving ? 'Saving…' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { update: updateSession } = useSession()
  const [txns, setTxns]           = useState<Transaction[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'dashboard' | 'ledger' | 'holdings' | 'ai'>('dashboard')
  const [modal, setModal]         = useState<{ open: boolean; form: typeof EMPTY_FORM; editId: number | null }>({ open: false, form: EMPTY_FORM, editId: null })
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [ledgerSearch, setLedgerSearch]   = useState('')
  const [ledgerFilter, setLedgerFilter]   = useState('ALL')
  const [aiResult, setAiResult]   = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)
  const [fitStock, setFitStock]   = useState('')
  const [fitResult, setFitResult] = useState<any>(null)
  const [fitLoading, setFitLoading] = useState(false)
  const [fitError, setFitError]   = useState<string | null>(null)

  async function refresh() {
    const res = await fetch('/api/portfolio')
    if (res.ok) setTxns(await res.json())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const { enriched, holdings, summary, state, taxSummary } = useMemo(() => calcPortfolio(txns), [txns])

  const filteredLedger = useMemo(() => {
    let rows = enriched
    if (ledgerSearch) rows = rows.filter(t =>
      t.assetName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (t.subCategory ?? '').toLowerCase().includes(ledgerSearch.toLowerCase()))
    if (ledgerFilter !== 'ALL') rows = rows.filter(t => t.assetType === ledgerFilter)
    return rows
  }, [enriched, ledgerSearch, ledgerFilter])

  async function handleSave(f: typeof EMPTY_FORM, isRetry = false) {
    if (!f.assetName || !f.price || !f.date) return
    setSaving(true)
    setSaveError(null)
    try {
      const body = { assetName: f.assetName.trim(), assetType: f.assetType, subCategory: f.subCategory || null, action: f.action, units: f.units, price: f.price, date: f.date, notes: f.notes || null }
      const res = modal.editId
        ? await fetch(`/api/portfolio/${modal.editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Stale JWT: UUID in session doesn't exist in DB yet — refresh the session token
        // and retry once so the user doesn't have to sign out and back in manually.
        if (res.status === 401 && !isRetry && (data?.error ?? '').includes('not found')) {
          setSaving(false)
          await updateSession()
          return handleSave(f, true)
        }
        setSaveError(data?.error ?? `Save failed (HTTP ${res.status}). Please try again.`)
        return
      }
      await refresh()
      setModal({ open: false, form: EMPTY_FORM, editId: null })
    } catch {
      setSaveError('Network error. Please check your connection and try again.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
    await refresh(); setDeleteConfirm(null)
  }

  async function analyseAI() {
    if (!holdings.length) return
    setAiLoading(true); setAiResult(null); setAiError(null)
    const holdingsSummary = holdings.map(h =>
      `${h.name} (${UNITLESS_TYPES.has(h.assetType) ? fmtInr(h.totalInvested) : `${h.units.toFixed(2)} units @ avg ₹${Math.round(h.avgBuyPrice)}`}, invested ${fmtInr(h.totalInvested)})`
    ).join('; ')
    const prompt = `Senior portfolio manager. Portfolio:${holdingsSummary}\nTotal invested:${fmtInr(summary.totalInvested)}, Realized P&L:${fmtInr(summary.realizedPnL)}\nPersonalised analysis. Reply ONLY with JSON:\n{"health_score":72,"health_reasoning":"2 sentences","quality_score":68,"sector_concentration":"2 sentences","top_risks":["r1","r2","r3"],"positive_aspects":["p1","p2"],"largest_position":"name and %","suggested_rebalance":"2 sentences","sip_suggestion":"2 sentences","correlation_warning":"1 sentence"}`
    try {
      const res = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, maxTokens: 1200, feature: 'portfolio', webSearch: false }) })
      if (res.ok) {
        setAiResult(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setAiError(data?.error ?? `Analysis failed (HTTP ${res.status}). Please try again.`)
      }
    } catch {
      setAiError('Network error. Please check your connection and try again.')
    }
    setAiLoading(false)
  }

  async function checkFit() {
    const s = fitStock.trim()
    if (!s || !holdings.length) return
    setFitLoading(true); setFitResult(null); setFitError(null)
    const prompt = `Analyst. Portfolio:${holdings.map(h => h.name).join(', ')}. Considering:"${s}".\nReply ONLY with JSON:\n{"already_held":false,"recommendation":"Add","fit_score":72,"reasoning":"2 sentences","concentration_risk":"Low — 1 sentence","suggested_allocation":"3-5%","key_monitorable":"1 thing"}`
    try {
      const res = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, maxTokens: 600, feature: 'portfolio-fit', stock: s, webSearch: false }) })
      if (res.ok) {
        setFitResult(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setFitError(data?.error ?? `Check failed (HTTP ${res.status}). Please try again.`)
      }
    } catch {
      setFitError('Network error. Please check your connection and try again.')
    }
    setFitLoading(false)
  }

  // ── Chart data ──────────────────────────────────────────────────────────────
  const allocationData = useMemo(() => {
    const m: Record<string, number> = {}
    holdings.forEach(h => { m[h.assetType] = (m[h.assetType] || 0) + h.totalInvested })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [holdings])

  const monthlyData = useMemo(() => {
    const m: Record<string, number> = {}
    enriched.filter(t => t.action === 'Buy').forEach(t => { const k = monthKey(t.date); m[k] = (m[k] || 0) + t.units * t.price })
    return Object.keys(m).sort().slice(-12).map(k => ({ month: monthLabel(k), invested: Math.round(m[k]) }))
  }, [enriched])

  const typeBreakdownData = useMemo(() => {
    const m: Record<string, number> = {}
    enriched.filter(t => t.action === 'Buy').forEach(t => { m[t.assetType] = (m[t.assetType] || 0) + t.units * t.price })
    return Object.entries(m).map(([name, value]) => ({
      name: name.replace('DIRECT EQUITY','EQUITY').replace('MUTUAL FUNDS','MF').replace('DEBT MUTUAL FUNDS','DEBT MF').replace('GOLD - PHYSICAL','GOLD').replace('BUSINESS FUNDS','BUSINESS'),
      value: Math.round(value),
    })).sort((a, b) => b.value - a.value)
  }, [enriched])

  const pnlByAssetData = useMemo(() => Object.entries(state)
    .filter(([, s]) => Math.abs(s.realizedPnL) > 1)
    .map(([name, s]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, pnl: Math.round(s.realizedPnL) }))
    .sort((a, b) => b.pnl - a.pnl), [state])

  const hasTax = taxSummary.stcgEquity !== 0 || taxSummary.ltcgEquity !== 0 || taxSummary.debtOther !== 0
  const pnlColor = summary.realizedPnL >= 0 ? T.green : T.red
  const hs = Math.min(parseInt(aiResult?.health_score) || 0, 100)
  const hsColor = hs >= 70 ? T.green : hs >= 50 ? T.amber : T.red

  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'ledger',    label: '📋 Ledger' },
    { id: 'holdings',  label: '💼 Holdings' },
    { id: 'ai',        label: '🤖 AI Analysis' },
  ] as const

  const tooltip = {
    contentStyle: { background: T.tooltipBg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text, boxShadow: T.shadow },
    labelStyle: { color: T.textSec },
  }
  const card: React.CSSProperties = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: T.shadow }
  const th: React.CSSProperties = { padding: '11px 14px', fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: T.bgLight, textAlign: 'left' }

  function openEdit(t: Transaction) {
    setModal({ open: true, form: { assetName: t.assetName, assetType: t.assetType, subCategory: t.subCategory ?? '', action: t.action, units: String(t.units), price: String(t.price), date: t.date.slice(0, 10), notes: t.notes ?? '' }, editId: t.id })
  }
  function openClone(t: Transaction) {
    setModal({ open: true, form: { assetName: t.assetName, assetType: t.assetType, subCategory: t.subCategory ?? '', action: t.action, units: '', price: '', date: new Date().toISOString().slice(0, 10), notes: '' }, editId: null })
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>Portfolio Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMut }}>Full transaction ledger · KPI dashboard · AI-powered insights</p>
        </div>
        <button onClick={() => setModal({ open: true, form: EMPTY_FORM, editId: null })}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: T.shadowMd }}>
          + Add Transaction
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.bgLight, borderRadius: 12, padding: 4, border: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', fontWeight: tab === t.id ? 700 : 500,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            background: tab === t.id ? T.accent : 'transparent',
            color: tab === t.id ? '#fff' : T.textMut,
            boxShadow: tab === t.id ? T.shadowMd : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: T.textMut, fontSize: 14 }}>Loading portfolio…</div>}

      {/* ── DASHBOARD ───────────────────────────────────────────────────────── */}
      {!loading && tab === 'dashboard' && (
        <div>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {([
              { label: 'Total Invested',  value: fmtInr(summary.totalInvested), color: T.text,   sub: `${summary.count} transactions`, icon: '💰' },
              { label: 'Realized P&L',    value: summary.count === 0 ? '—' : fmtInr(summary.realizedPnL), color: pnlColor, sub: summary.realizedPnL >= 0 ? 'Profit from sells' : 'Loss from sells', icon: summary.realizedPnL >= 0 ? '📈' : '📉' },
              { label: 'Net Deployed',    value: fmtInr(summary.netDeployed),   color: T.amber,  sub: 'Invested − recovered', icon: '🏦' },
              { label: 'Open Positions',  value: String(holdings.length),        color: T.accent, sub: 'Active holdings', icon: '📂' },
            ] as const).map(c => (
              <div key={c.label} style={{ ...card, padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{c.label}</div>
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {txns.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ color: T.textMut, fontSize: 14, marginBottom: 6 }}>No transactions yet.</div>
              <div style={{ color: T.textSec, fontSize: 13 }}>Click <strong style={{ color: T.accent }}>+ Add Transaction</strong> to get started.</div>
            </div>
          ) : (
            <>
              {/* Risk meter + Tax snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: hasTax ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
                <RiskMeter holdings={holdings} />
                {hasTax && (
                  <div style={{ ...card, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Tax Snapshot</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>Estimated from realized gains · not tax advice</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {([
                        { label: 'STCG — Equity (<1yr)',   value: taxSummary.stcgEquity,  rate: '15% flat' },
                        { label: 'LTCG — Equity (≥1yr)',   value: taxSummary.ltcgEquity,  rate: '10% above ₹1L' },
                        { label: 'Debt / Others',          value: taxSummary.debtOther,    rate: 'As per slab' },
                      ] as const).filter(r => r.value !== 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: T.bgLight, borderRadius: 8, border: `1px solid ${T.borderFaint}` }}>
                          <div>
                            <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{r.label}</div>
                            <div style={{ fontSize: 10, color: T.textMut }}>{r.rate}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: r.value >= 0 ? T.green : T.red }}>{r.value >= 0 ? '+' : ''}{fmtInr(r.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Allocation donut */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Asset Allocation</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>Current holdings by asset type</div>
                  {allocationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                          {allocationData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...tooltip} formatter={(v) => [fmtInr(Number(v)), 'Invested']} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: T.textSec }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 12 }}>No holdings data</div>}
                </div>

                {/* Monthly bars */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Monthly Investment</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>Buy cash deployed per month (last 12)</div>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={T.borderFaint} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => fmtInr(v)} tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip {...tooltip} formatter={(v) => [fmtInr(Number(v)), 'Invested']} />
                        <Bar dataKey="invested" fill={T.accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 12 }}>No buy transactions</div>}
                </div>

                {/* Category breakdown */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Investment by Category</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>Total capital deployed per asset type</div>
                  {typeBreakdownData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={typeBreakdownData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid horizontal={false} stroke={T.borderFaint} />
                        <XAxis type="number" tickFormatter={v => fmtInr(v)} tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} width={64} />
                        <Tooltip {...tooltip} formatter={(v) => [fmtInr(Number(v)), 'Invested']} />
                        <Bar dataKey="value" fill={T.accentBr} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 12 }}>No data</div>}
                </div>

                {/* P&L by asset */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Realized P&L by Asset</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>Gains / losses from sell transactions only</div>
                  {pnlByAssetData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={pnlByAssetData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={T.borderFaint} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => fmtInr(v)} tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip {...tooltip} formatter={(v) => [fmtInr(Number(v)), 'P&L']} />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                          {pnlByAssetData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? T.green : T.red} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 12, gap: 6 }}>
                      <span>No sell transactions yet</span>
                      <span style={{ fontSize: 11 }}>P&L populates after your first sell</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LEDGER ──────────────────────────────────────────────────────────── */}
      {!loading && tab === 'ledger' && (
        <div>
          {enriched.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} placeholder="🔍  Search asset…"
                style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13, outline: 'none' }} />
              <select value={ledgerFilter} onChange={e => setLedgerFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13, outline: 'none' }}>
                <option value="ALL">All Types</option>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div style={{ ...card, overflow: 'hidden' }}>
            {enriched.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMut, fontSize: 14 }}>
                No transactions yet. Click <strong style={{ color: T.accent }}>+ Add Transaction</strong>.
              </div>
            ) : filteredLedger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMut, fontSize: 13 }}>No transactions match your filter.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Date','Asset','Type','Action','Units','Price','Cash Flow','P&L','Tax',''].map((h, i) => (
                        <th key={h + i} style={{ ...th, textAlign: ['Units','Price','Cash Flow','P&L','Tax'].includes(h) ? 'right' : h === '' ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map(t => {
                      const ul = UNITLESS_TYPES.has(t.assetType)
                      const [bl, sl] = ACTION_LABELS[t.assetType] ?? ['Buy','Sell']
                      return (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                          <td style={{ padding: '11px 14px', color: T.textSec, whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                          <td style={{ padding: '11px 14px', color: T.text, fontWeight: 600 }}>
                            {t.assetName}
                            {t.subCategory && <span style={{ display: 'block', fontSize: 11, color: T.textMut, fontWeight: 400 }}>{t.subCategory}</span>}
                          </td>
                          <td style={{ padding: '11px 14px', color: T.textMut, fontSize: 11 }}>{t.assetType}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                              background: t.action === 'Buy' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                              color: t.action === 'Buy' ? T.green : T.red }}>
                              {t.action === 'Buy' ? bl : sl}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', color: T.textMut, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {ul ? '—' : t.units.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                          </td>
                          <td style={{ padding: '11px 14px', color: T.textMut, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {ul ? '—' : `₹${t.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t.cashFlow >= 0 ? T.green : T.red }}>
                            {t.cashFlow >= 0 ? '+' : ''}{fmtInr(t.cashFlow)}
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: t.pnl === null ? T.textMut : t.pnl >= 0 ? T.green : T.red }}>
                            {t.pnl === null ? '—' : `${t.pnl >= 0 ? '+' : ''}${fmtInr(t.pnl)}`}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            {t.taxTag
                              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                  background: t.taxTag === 'LTCG' ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                                  color: t.taxTag === 'LTCG' ? T.green : T.amber }}>{t.taxTag}</span>
                              : <span style={{ color: T.textMut }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button title="Clone" onClick={() => openClone(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 13, padding: '2px 4px' }}>⧉</button>
                            <button title="Edit"  onClick={() => openEdit(t)}  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 14, padding: '2px 4px' }}>✏️</button>
                            {deleteConfirm === t.id ? (
                              <>
                                <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontSize: 12, fontWeight: 700, padding: '2px 4px' }}>Confirm</button>
                                <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 11, padding: '2px 4px' }}>Cancel</button>
                              </>
                            ) : (
                              <button title="Delete" onClick={() => setDeleteConfirm(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 14, padding: '2px 4px' }}>🗑️</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HOLDINGS ────────────────────────────────────────────────────────── */}
      {!loading && tab === 'holdings' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          {holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMut, fontSize: 14 }}>No open positions. Add buy transactions to see your holdings here.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Asset','Type','Held Since','Units Held','Avg Buy Price','Total Invested','Realized P&L'].map(h => (
                      <th key={h} style={{ ...th, textAlign: ['Asset','Type','Held Since'].includes(h) ? 'left' : 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.sort((a, b) => b.totalInvested - a.totalInvested).map(h => {
                    const ul = UNITLESS_TYPES.has(h.assetType)
                    return (
                      <tr key={h.name} style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                        <td style={{ padding: '12px 14px', color: T.text, fontWeight: 600 }}>{h.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, color: T.textMut, padding: '2px 7px', borderRadius: 4, background: T.bgLight, border: `1px solid ${T.border}` }}>{h.assetType}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 12, color: T.textSec }}>{fmtDate(h.firstBuyDate)}</div>
                          <div style={{ fontSize: 10, color: T.textMut }}>{holdingAge(h.firstBuyDate)}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: T.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {ul ? '—' : h.units.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                        </td>
                        <td style={{ padding: '12px 14px', color: T.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {ul ? '—' : `₹${Math.round(h.avgBuyPrice).toLocaleString('en-IN')}`}
                        </td>
                        <td style={{ padding: '12px 14px', color: T.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtInr(h.totalInvested)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: h.realizedPnL === 0 ? T.textMut : h.realizedPnL > 0 ? T.green : T.red }}>
                          {h.realizedPnL === 0 ? '—' : `${h.realizedPnL > 0 ? '+' : ''}${fmtInr(h.realizedPnL)}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${T.border}`, background: T.bgLight }}>
                    <td colSpan={5} style={{ padding: '12px 14px', color: T.textSec, fontSize: 12, fontWeight: 600 }}>TOTAL ({holdings.length} positions)</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: T.text, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtInr(holdings.reduce((s, h) => s + h.totalInvested, 0))}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.realizedPnL >= 0 ? T.green : T.red }}>
                      {summary.realizedPnL === 0 ? '—' : `${summary.realizedPnL > 0 ? '+' : ''}${fmtInr(summary.realizedPnL)}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AI ANALYSIS ─────────────────────────────────────────────────────── */}
      {!loading && tab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Portfolio Health Analysis</div>
                <div style={{ fontSize: 12, color: T.textMut }}>{holdings.length} active holdings · AI-powered assessment</div>
              </div>
              <button onClick={analyseAI} disabled={aiLoading || !holdings.length}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: aiLoading || !holdings.length ? 0.5 : 1, boxShadow: T.shadowMd }}>
                {aiLoading ? 'Analysing…' : 'Analyse Portfolio →'}
              </button>
            </div>
            {!holdings.length && <div style={{ fontSize: 13, color: T.textMut }}>Add buy transactions to enable AI analysis.</div>}
            {aiLoading && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0', color: T.textSec, fontSize: 13 }}><div className="dv-spinner" />Analysing your portfolio…</div>}
            {aiError && !aiLoading && <div style={{ fontSize: 13, color: T.red, padding: '10px 14px', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, marginTop: 4 }}>Analysis failed: {aiError}</div>}
            {aiResult && !aiLoading && (
              <div className="anim-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {([['Health Score', hs, hsColor], ['Quality Score', aiResult.quality_score ?? '—', T.amber], ['Largest Position', aiResult.largest_position ?? '—', T.text]] as const).map(([label, val, color]) => (
                    <div key={label} style={{ background: T.bgLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                {aiResult.health_reasoning && <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginBottom: 12 }}>{aiResult.health_reasoning}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Top Risks</div>
                    {(aiResult.top_risks ?? []).map((r: string, i: number) => <div key={i} style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, display: 'flex', gap: 6 }}><span style={{ color: T.red }}>⚠</span>{r}</div>)}
                  </div>
                  <div style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.green, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Strengths</div>
                    {(aiResult.positive_aspects ?? []).map((p: string, i: number) => <div key={i} style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, display: 'flex', gap: 6 }}><span style={{ color: T.green }}>✓</span>{p}</div>)}
                  </div>
                </div>
                {aiResult.suggested_rebalance && <div style={{ fontSize: 12, color: T.textSec, padding: '10px 14px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 8, marginBottom: 8 }}>💡 <strong style={{ color: T.amber }}>Rebalancing:</strong> {aiResult.suggested_rebalance}</div>}
                {aiResult.sip_suggestion && <div style={{ fontSize: 12, color: T.textSec, padding: '10px 14px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 8 }}>📈 <strong style={{ color: T.accent }}>SIP:</strong> {aiResult.sip_suggestion}</div>}
              </div>
            )}
          </div>

          <div style={{ ...card, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Check New Investment Fit</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>Analyse how a new asset fits your existing portfolio</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={fitStock} onChange={e => setFitStock(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkFit()}
                placeholder="Enter stock, fund, or asset name…"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgLight, color: T.text, fontSize: 13, outline: 'none' }} />
              <button onClick={checkFit} disabled={fitLoading || !fitStock.trim() || !holdings.length}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: T.amber, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: fitLoading || !fitStock.trim() || !holdings.length ? 0.5 : 1 }}>
                {fitLoading ? 'Checking…' : 'Check Fit'}
              </button>
            </div>
            {!holdings.length && <div style={{ fontSize: 12, color: T.textMut, marginTop: 8 }}>Add holdings first to enable fit check.</div>}
            {fitError && !fitLoading && <div style={{ fontSize: 13, color: T.red, padding: '10px 14px', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, marginTop: 8 }}>Check failed: {fitError}</div>}
            {fitResult && !fitLoading && (
              <div className="anim-in" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: fitResult.recommendation === 'Add' ? T.green : fitResult.recommendation === 'Avoid' ? T.red : T.amber }}>{fitResult.recommendation}</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 2 }}>Fit Score</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.amber }}>{fitResult.fit_score}/100</div>
                  </div>
                  {fitResult.already_held && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(5,150,105,0.08)', color: T.green, border: '1px solid rgba(5,150,105,0.2)' }}>Already Held</span>}
                </div>
                <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginBottom: 12 }}>{fitResult.reasoning}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 12, background: T.bgLight, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Concentration Risk</div>
                    <div style={{ fontSize: 13, color: T.textSec }}>{fitResult.concentration_risk}</div>
                  </div>
                  <div style={{ padding: 12, background: T.bgLight, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Suggested Allocation</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.amber }}>{fitResult.suggested_allocation}</div>
                  </div>
                </div>
                {fitResult.key_monitorable && <div style={{ marginTop: 10, fontSize: 12, padding: '8px 12px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 8, color: T.textSec }}>👁 <strong style={{ color: T.amber }}>Watch:</strong> {fitResult.key_monitorable}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {modal.open && (
        <TxModal
          initial={modal.form}
          onSave={handleSave}
          onClose={() => { setModal({ open: false, form: EMPTY_FORM, editId: null }); setSaveError(null) }}
          saving={saving}
          saveError={saveError ?? undefined}
        />
      )}
    </div>
  )
}
