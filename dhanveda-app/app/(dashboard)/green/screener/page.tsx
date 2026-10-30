'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_SECTORS } from '@/lib/stockSeed'

/* ── Visual config ────────────────────────────────────────────────────────── */
const TIER_CFG: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
  'A+': { color: '#047857', bg: '#ECFDF5', border: '#6EE7B7', label: 'Green Leader',     desc: 'Exemplary ESG — core business drives the green transition' },
  'A':  { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', label: 'Low Carbon',        desc: 'Low environmental footprint, strong sustainability practices' },
  'B+': { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'ESG Positive',      desc: 'Strong social or governance dimension, improving environment' },
  'B':  { color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', label: 'ESG Moderate',      desc: 'Meets baseline ESG standards, limited significant risks' },
  'C':  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'ESG Developing',    desc: 'Material environmental impact, some mitigation underway' },
  'D':  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'ESG Laggard',       desc: 'High carbon or governance risk, significant transition exposure' },
}

const RISK_CFG: Record<string, { color: string; bg: string; short: string }> = {
  'Very Low':  { color: '#047857', bg: 'rgba(4,120,87,0.08)',    short: 'VL' },
  'Low':       { color: '#059669', bg: 'rgba(5,150,105,0.08)',   short: 'L'  },
  'Medium':    { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   short: 'M'  },
  'High':      { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   short: 'H'  },
  'Very High': { color: '#991B1B', bg: 'rgba(153,27,27,0.08)',   short: 'VH' },
}

const SCORE_COLOR = (v: number | null) => {
  if (v === null) return '#9CA3AF'
  if (v >= 8) return '#047857'
  if (v >= 6) return '#059669'
  if (v >= 4) return '#D97706'
  return '#DC2626'
}

const ESG_PRESETS = [
  { label: '🌿 All securities',    tiers: [] as string[], desc: 'Full 800+ security universe' },
  { label: '🌱 Leaders (A+/A)',    tiers: ['A+', 'A'],   desc: 'Green energy, IT, clean power' },
  { label: '💙 Positive (B+/B)',   tiers: ['B+', 'B'],   desc: 'Finance, pharma, FMCG, telecom' },
  { label: '⚠️  Developing (C)',    tiers: ['C'],          desc: 'Auto, cement, capital goods' },
  { label: '🔴 Laggards (D)',       tiers: ['D'],          desc: 'Metals, fossil fuels' },
]

const RISK_OPTS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']

interface StockRow {
  ticker: string; name: string; exchange: string; sector: string | null
  industry: string | null; marketCap: string | null
  esgE: number | null; esgS: number | null; esgG: number | null
  esgTier: string | null; esgRisk: string | null
  brsrMandated: boolean | null; esgNotes: string | null; esgUpdatedAt: string | null
  instrumentType: string | null
}

const INSTRUMENT_TYPES = ['Equity', 'REIT', 'InvIT', 'ETF', 'Mutual Fund']
const TYPE_BADGE: Record<string, { color: string; bg: string }> = {
  'REIT':        { color: '#B45309', bg: '#FEF3C7' },
  'InvIT':       { color: '#0F766E', bg: '#CCFBF1' },
  'ETF':         { color: '#1D4ED8', bg: '#DBEAFE' },
  'Mutual Fund': { color: '#6D28D9', bg: '#EDE9FE' },
}

interface Screen { id: string; name: string; filters: any; sortBy: string; sortDir: string }
interface Filters {
  sectors: string[]; tiers: string[]; risks: string[]
  exchange: string; mktCap: string; brsrOnly: boolean; instrumentType: string
}
const EMPTY: Filters = { sectors: [], tiers: [], risks: [], exchange: '', mktCap: '', brsrOnly: false, instrumentType: '' }


/* ════════════════════════════════════════════════════════════════════════════ */
export default function ScreenerPage() {
  const router = useRouter()

  const [stocks, setStocks]         = useState<StockRow[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [initState, setInitState]   = useState<'check' | 'needed' | 'ready'>('check')
  const [initing, setIniting]       = useState(false)
  const [initMsg, setInitMsg]       = useState('')

  const [expanded, setExpanded]     = useState<string | null>(null)

  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState<Filters>(EMPTY)
  const [esgPreset, setEsgPreset]   = useState(0)
  const [sortBy, setSortBy]         = useState('esgAvg')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(true)

  const [screens, setScreens]       = useState<Screen[]>([])
  const [showSave, setShowSave]     = useState(false)
  const [saveName, setSaveName]     = useState('')
  const [activeScreen, setActiveScreen] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef    = useRef({ page: 1, search: '', filters: EMPTY, sortBy: 'esgAvg', sortDir: 'desc' as 'asc'|'desc' })

  /* ── Build query string ── */
  function buildQS(pg: number, s: string, f: Filters, sb: string, sd: string) {
    const p = new URLSearchParams({ page: String(pg), sortBy: sb, sortDir: sd })
    if (s)                   p.set('search', s)
    if (f.exchange)          p.set('exchange', f.exchange)
    if (f.mktCap)            p.set('mktCap', f.mktCap)
    if (f.sectors.length)    p.set('sectors', f.sectors.join(','))
    if (f.tiers.length)      p.set('tiers', f.tiers.join(','))
    if (f.risks.length)      p.set('risks', f.risks.join(','))
    if (f.brsrOnly)          p.set('brsr', '1')
    if (f.instrumentType)    p.set('instrumentType', f.instrumentType)
    return p.toString()
  }

  const fetchStocks = useCallback(async (
    pg: number   = stateRef.current.page,
    s:  string   = stateRef.current.search,
    f:  Filters  = stateRef.current.filters,
    sb: string   = stateRef.current.sortBy,
    sd: 'asc'|'desc' = stateRef.current.sortDir,
  ) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/screener/stocks?${buildQS(pg, s, f, sb, sd)}`)
      const d = await r.json()
      if (d.error) { setInitState('needed'); setLoading(false); return }
      setStocks(d.stocks ?? [])
      setTotal(d.total ?? 0)
    } catch { setInitState('needed') }
    setLoading(false)
  }, [])

  useEffect(() => { stateRef.current = { page, search, filters, sortBy, sortDir } }, [page, search, filters, sortBy, sortDir])

  /* ── Init ── */
  useEffect(() => {
    fetch('/api/screener/stocks?page=1&sortBy=esgAvg&sortDir=desc')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setInitState('needed'); return }
        setInitState('ready'); setStocks(d.stocks ?? []); setTotal(d.total ?? 0)
      })
      .catch(() => setInitState('needed'))
  }, [])

  useEffect(() => {
    if (initState === 'ready') {
      fetch('/api/screener/screens').then(r => r.ok ? r.json() : []).then(d => setScreens(Array.isArray(d) ? d : []))
    }
  }, [initState])

  /* ── Refetch on filter / sort changes ── */
  useEffect(() => {
    if (initState !== 'ready') return
    setPage(1); fetchStocks(1, search, filters, sortBy, sortDir)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDir])

  useEffect(() => {
    if (initState !== 'ready') return
    fetchStocks(page, search, filters, sortBy, sortDir)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  /* ── Initialize DB ── */
  async function initialize() {
    setIniting(true)
    try {
      const r = await fetch('/api/screener/migrate', { method: 'POST' })
      const d = await r.json()
      setInitMsg(d.message ?? d.error ?? 'Error')
      if (d.ok) { setInitState('ready'); fetchStocks(1, '', EMPTY, 'esgAvg', 'desc') }
    } catch (e: any) { setInitMsg(e.message) }
    setIniting(false)
  }

  /* ── Search debounce ── */
  function onSearch(v: string) {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1); fetchStocks(1, v, filters, sortBy, sortDir)
    }, 400)
  }

  /* ── Sort ── */
  function onSort(key: string) {
    const dir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortBy(key); setSortDir(dir)
  }

  /* ── ESG preset ── */
  function applyPreset(idx: number) {
    setEsgPreset(idx)
    setFilters(f => ({ ...f, tiers: ESG_PRESETS[idx].tiers }))
  }

  /* ── Screens ── */
  async function saveScreen() {
    if (!saveName.trim()) return
    const r = await fetch('/api/screener/screens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: saveName.trim(), filters, sortBy, sortDir }),
    })
    if (r.ok) {
      fetch('/api/screener/screens').then(r => r.json()).then(d => setScreens(Array.isArray(d) ? d : []))
      setShowSave(false); setSaveName('')
    }
  }
  function loadScreen(sc: Screen) {
    setFilters(sc.filters ?? EMPTY); setSortBy(sc.sortBy ?? 'esgTier')
    setSortDir((sc.sortDir as any) ?? 'asc'); setActiveScreen(sc.id); setPage(1)
  }
  async function deleteScreen(id: string) {
    await fetch('/api/screener/screens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setScreens(s => s.filter(sc => sc.id !== id))
    if (activeScreen === id) setActiveScreen(null)
  }

  function toggleFilter<K extends keyof Filters>(key: K, val: any) {
    setFilters(f => {
      const arr = f[key] as string[]
      return { ...f, [key]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] }
    })
  }

  const totalPages = Math.ceil(total / 30)
  const sortArrow  = (k: string) => sortBy === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  /* ════════════════ INIT STATES ════════════════════════════════════════════ */
  if (initState === 'check') return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="dv-spinner" />
      <span className="text-sm" style={{ color: '#9CA3AF' }}>Loading ESG matrix…</span>
    </div>
  )

  if (initState === 'needed') return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div style={{ fontSize: 52 }}>🌿</div>
      <h2 className="text-xl font-bold mt-3 mb-2" style={{ color: '#064E3B' }}>ESG Priority Screener</h2>
      <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
        Initialize the database to unlock the full <strong>800+ stock ESG matrix</strong> — NSE & BSE equities, REITs, and InvITs, pre-scored by sector with
        company-specific adjustments. Zero API calls required for browsing.
      </p>
      <p className="text-xs mb-6" style={{ color: '#9CA3AF' }}>
        Use on-demand AI analysis per stock for weekly-refreshed scores.
      </p>
      {initMsg && (
        <div className="text-sm mb-4 p-3 rounded-xl"
          style={{
            background: initMsg.includes('seeded') || initMsg.includes('ready') ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
            color: initMsg.includes('seeded') || initMsg.includes('ready') ? '#059669' : '#DC2626',
            border: `1px solid ${initMsg.includes('seeded') || initMsg.includes('ready') ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.15)'}`,
          }}>
          {initMsg}
        </div>
      )}
      <button onClick={initialize} disabled={initing}
        className="px-8 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
        {initing ? 'Setting up…' : 'Initialize ESG Matrix'}
      </button>
    </div>
  )

  /* ════════════════ MAIN UI ════════════════════════════════════════════════ */
  return (
    <div className="flex gap-4 max-w-[1440px] mx-auto pb-8">

      {/* ════ SIDEBAR ════ */}
      {showFilters && (
        <div className="w-52 flex-shrink-0 space-y-3">

          {/* ESG Tier preset */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#059669' }}>ESG Priority</div>
            {ESG_PRESETS.map((p, i) => (
              <button key={i} onClick={() => applyPreset(i)}
                className="w-full text-left px-2.5 py-2 rounded-lg mb-1 transition-all"
                style={{
                  background: esgPreset === i ? 'rgba(5,150,105,0.10)' : 'transparent',
                  color:      esgPreset === i ? '#059669' : '#374151',
                  fontWeight: esgPreset === i ? 700 : 400,
                  border:     esgPreset === i ? '1px solid rgba(5,150,105,0.25)' : '1px solid transparent',
                  fontSize: 12,
                }}>
                <div>{p.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{p.desc}</div>
              </button>
            ))}
          </div>

          {/* ESG Risk */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>Transition Risk</div>
            {RISK_OPTS.map(r => {
              const cfg = RISK_CFG[r]
              return (
                <label key={r} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                  <input type="checkbox" checked={filters.risks.includes(r)}
                    onChange={() => toggleFilter('risks', r)} />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}>{r}</span>
                </label>
              )
            })}
          </div>

          {/* BRSR */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>BRSR Mandate</div>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#374151' }}>
              <input type="checkbox" checked={filters.brsrOnly}
                onChange={e => setFilters(f => ({ ...f, brsrOnly: e.target.checked }))} />
              Top-1000 mandated only
            </label>
          </div>

          {/* Asset Category */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>Asset Category</div>
            {['', ...INSTRUMENT_TYPES].map(t => (
              <label key={t} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer" style={{ color: '#374151' }}>
                <input type="radio" name="instrumentType" checked={filters.instrumentType === t}
                  onChange={() => setFilters(f => ({ ...f, instrumentType: t }))} />
                {t || 'All'}
                {t && TYPE_BADGE[t] && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                    style={{ background: TYPE_BADGE[t].bg, color: TYPE_BADGE[t].color }}>{t}</span>
                )}
              </label>
            ))}
          </div>

          {/* Exchange */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>Exchange</div>
            {['', 'NSE', 'BSE', 'BOTH'].map(ex => (
              <label key={ex} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer" style={{ color: '#374151' }}>
                <input type="radio" name="exchange" checked={filters.exchange === ex}
                  onChange={() => setFilters(f => ({ ...f, exchange: ex }))} />
                {ex || 'All'}
              </label>
            ))}
          </div>

          {/* Market cap */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>Market Cap</div>
            {['', 'Large', 'Mid', 'Small', 'Micro'].map(mc => (
              <label key={mc} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer" style={{ color: '#374151' }}>
                <input type="radio" name="mktCap" checked={filters.mktCap === mc}
                  onChange={() => setFilters(f => ({ ...f, mktCap: mc }))} />
                {mc || 'All'}
              </label>
            ))}
          </div>

          {/* Sectors */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>Sectors</div>
              {filters.sectors.length > 0 && (
                <button onClick={() => setFilters(f => ({ ...f, sectors: [] }))}
                  className="text-[10px]" style={{ color: '#9CA3AF' }}>Clear</button>
              )}
            </div>
            <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
              {ALL_SECTORS.map(s => (
                <label key={s} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer rounded px-1 hover:bg-green-50">
                  <input type="checkbox" checked={filters.sectors.includes(s)}
                    onChange={() => toggleFilter('sectors', s)} />
                  <span style={{ color: '#374151' }}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={() => { setFilters(EMPTY); setEsgPreset(0); setSortBy('esgAvg'); setSortDir('desc') }}
            className="w-full text-xs py-2 rounded-lg transition-all"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.12)' }}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* ════ MAIN CONTENT ════ */}
      <div className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={() => setShowFilters(v => !v)}
            className="text-xs px-3 py-2 rounded-lg font-medium shrink-0"
            style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', color: '#059669' }}>
            {showFilters ? '⟵ Filters' : '☰ Filters'}
          </button>

          <input value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Search company name or ticker…"
            className="flex-1 min-w-36 text-sm px-4 py-2 rounded-xl outline-none transition-shadow focus:shadow-md"
            style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', color: '#064E3B' }} />

          <button onClick={initialize} disabled={initing}
            className="text-xs px-3 py-2 rounded-lg font-medium shrink-0 transition-all disabled:opacity-50"
            style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', color: '#059669' }}
            title="Re-seed database with latest stock list">
            {initing ? '⟳ Seeding…' : '⟳ Refresh Data'}
          </button>

          <button onClick={() => setShowSave(true)}
            className="text-xs px-3 py-2 rounded-lg font-semibold text-white shrink-0 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
            + Save Screen
          </button>
        </div>

        {/* Saved screens */}
        {screens.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap items-center">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Saved:</span>
            <button onClick={() => { setActiveScreen(null); setFilters(EMPTY); setEsgPreset(0) }}
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: !activeScreen ? '#059669' : 'rgba(5,150,105,0.08)', color: !activeScreen ? '#fff' : '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
              Default
            </button>
            {screens.map(sc => (
              <div key={sc.id} className="flex items-center">
                <button onClick={() => loadScreen(sc)}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: activeScreen === sc.id ? '#059669' : 'rgba(5,150,105,0.08)', color: activeScreen === sc.id ? '#fff' : '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                  {sc.name}
                </button>
                <button onClick={() => deleteScreen(sc.id)}
                  className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-0.5 hover:bg-red-50"
                  style={{ color: '#DC2626' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Refresh status message */}
        {initMsg && (
          <div className="mb-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: initMsg.includes('seeded') ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)', color: initMsg.includes('seeded') ? '#059669' : '#DC2626', border: `1px solid ${initMsg.includes('seeded') ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
            {initMsg}
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center gap-3 mb-2 text-xs flex-wrap" style={{ color: '#6B7280' }}>
          <span><strong style={{ color: '#064E3B' }}>{total.toLocaleString()}</strong> {filters.instrumentType ? filters.instrumentType + 's' : 'securities'}</span>
          {filters.instrumentType && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: TYPE_BADGE[filters.instrumentType]?.bg ?? 'rgba(5,150,105,0.08)', color: TYPE_BADGE[filters.instrumentType]?.color ?? '#059669' }}>
              {filters.instrumentType}
            </span>
          )}
          {esgPreset > 0 && <span className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>{ESG_PRESETS[esgPreset].label}</span>}
          {filters.sectors.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>{filters.sectors.join(', ')}</span>}
          <span style={{ color: '#9CA3AF' }}>·</span>
          <span>Ranked by ESG composite · Page {page} of {Math.ceil(total / 30) || 1}</span>
          <span className="text-[10px] ml-auto" style={{ color: '#9CA3AF' }}>Scores auto-refresh weekly</span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 8px rgba(5,150,105,0.06)' }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(to right,#F0FDF4,#ECFDF5)', borderBottom: '2px solid rgba(5,150,105,0.12)' }}>
                  <th className="px-3 py-3 text-xs font-bold text-center"
                    style={{ color: '#9CA3AF', minWidth: 44 }}>#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold sticky left-0 z-10 cursor-pointer"
                    style={{ color: '#059669', background: '#F0FDF4', minWidth: 220 }} onClick={() => onSort('name')}>
                    Company{sortArrow('name')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center"
                    style={{ color: '#059669', minWidth: 72 }}>Type</th>
                  <th className="px-3 py-3 text-xs font-bold text-center cursor-pointer"
                    style={{ color: '#059669', minWidth: 100 }} onClick={() => onSort('esgAvg')}>
                    ESG Score{sortArrow('esgAvg')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center cursor-pointer"
                    style={{ color: '#059669', minWidth: 56 }} onClick={() => onSort('esgE')}>
                    E{sortArrow('esgE')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center cursor-pointer"
                    style={{ color: '#059669', minWidth: 56 }} onClick={() => onSort('esgS')}>
                    S{sortArrow('esgS')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center cursor-pointer"
                    style={{ color: '#059669', minWidth: 56 }} onClick={() => onSort('esgG')}>
                    G{sortArrow('esgG')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center cursor-pointer"
                    style={{ color: '#059669', minWidth: 110 }} onClick={() => onSort('esgRisk')}>
                    Transition Risk{sortArrow('esgRisk')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center"
                    style={{ color: '#059669', minWidth: 60 }}>BRSR</th>
                  <th className="px-3 py-3 text-xs font-bold text-left"
                    style={{ color: '#059669', minWidth: 100 }} onClick={() => onSort('sector')}>
                    Sector{sortArrow('sector')}
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-center"
                    style={{ color: '#059669', minWidth: 80 }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(5,150,105,0.06)', background: i % 2 ? '#fafffe' : '#fff' }}>
                      <td className="px-3 py-3 text-center"><div className="animate-pulse h-4 w-6 rounded mx-auto" style={{ background: '#F3F4F6' }} /></td>
                      <td className="px-4 py-3"><div className="animate-pulse space-y-1.5">
                        <div className="h-3 w-40 rounded" style={{ background: '#E5E7EB' }} />
                        <div className="h-2 w-20 rounded" style={{ background: '#F3F4F6' }} />
                      </div></td>
                      <td className="px-3 py-3" />
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-3 py-3 text-center">
                          <div className="animate-pulse h-5 w-10 rounded mx-auto" style={{ background: '#F3F4F6' }} />
                        </td>
                      ))}
                      <td className="px-3 py-3" />
                    </tr>
                  ))
                ) : stocks.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-20">
                    <div style={{ fontSize: 36 }}>🔍</div>
                    <div className="text-sm mt-2" style={{ color: '#9CA3AF' }}>No stocks match your filters.</div>
                    <button onClick={() => { setFilters(EMPTY); setEsgPreset(0) }}
                      className="mt-3 text-xs px-4 py-2 rounded-lg"
                      style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>Clear filters</button>
                  </td></tr>
                ) : stocks.map((s, i) => {
                  const tier    = s.esgTier ?? 'B'
                  const tierCfg = TIER_CFG[tier] ?? TIER_CFG['B']
                  const riskCfg = RISK_CFG[s.esgRisk ?? 'Medium'] ?? RISK_CFG['Medium']
                  const isExpanded = expanded === s.ticker
                  const rank = (page - 1) * 30 + i + 1
                  const typeBadge = s.instrumentType && s.instrumentType !== 'Equity' ? TYPE_BADGE[s.instrumentType] : null

                  return (
                    <>
                      <tr key={s.ticker}
                        className="transition-colors duration-150 hover:bg-green-50 cursor-pointer"
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(5,150,105,0.07)', background: i % 2 === 0 ? '#fff' : '#fdfffe' }}
                        onClick={() => setExpanded(expanded === s.ticker ? null : s.ticker)}>

                        {/* Rank */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-xs font-mono font-bold" style={{ color: '#9CA3AF' }}>#{rank}</span>
                        </td>

                        {/* Company */}
                        <td className="px-4 py-2.5 sticky left-0 z-10" style={{ background: i % 2 === 0 ? '#fff' : '#fdfffe' }}>
                          <div className="flex items-start gap-2">
                            <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: tierCfg.color }} />
                            <div>
                              <div className="text-sm font-semibold leading-tight" style={{ color: '#064E3B', maxWidth: 195 }}>
                                {s.name.length > 28 ? s.name.slice(0, 26) + '…' : s.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                                  style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>{s.ticker}</span>
                                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{s.exchange}</span>
                                {s.marketCap && <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{s.marketCap}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-3 py-2.5 text-center">
                          {typeBadge ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: typeBadge.bg, color: typeBadge.color }}>
                              {s.instrumentType}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: '#D1D5DB' }}>—</span>
                          )}
                        </td>

                        {/* ESG Tier badge */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.border}` }}>
                              {tier}
                            </span>
                            <span className="text-[9px]" style={{ color: tierCfg.color }}>{tierCfg.label}</span>
                          </div>
                        </td>

                        {/* E score */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold" style={{ color: SCORE_COLOR(s.esgE) }}>
                              {s.esgE ?? '–'}
                            </span>
                            <span className="text-[9px]" style={{ color: '#9CA3AF' }}>ENV</span>
                          </div>
                        </td>

                        {/* S score */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold" style={{ color: SCORE_COLOR(s.esgS) }}>
                              {s.esgS ?? '–'}
                            </span>
                            <span className="text-[9px]" style={{ color: '#9CA3AF' }}>SOC</span>
                          </div>
                        </td>

                        {/* G score */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold" style={{ color: SCORE_COLOR(s.esgG) }}>
                              {s.esgG ?? '–'}
                            </span>
                            <span className="text-[9px]" style={{ color: '#9CA3AF' }}>GOV</span>
                          </div>
                        </td>

                        {/* Transition risk */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: riskCfg.bg, color: riskCfg.color }}>
                            {s.esgRisk ?? '–'}
                          </span>
                        </td>

                        {/* BRSR */}
                        <td className="px-3 py-2.5 text-center">
                          {s.brsrMandated
                            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(5,150,105,0.10)', color: '#059669' }}>Yes</span>
                            : <span className="text-[10px]" style={{ color: '#9CA3AF' }}>–</span>}
                        </td>

                        {/* Sector */}
                        <td className="px-3 py-2.5 text-xs" style={{ color: '#374151' }}>
                          <div>{s.sector ?? '–'}</div>
                          {s.industry && <div className="text-[10px]" style={{ color: '#9CA3AF' }}>{s.industry.length > 20 ? s.industry.slice(0, 18) + '…' : s.industry}</div>}
                        </td>

                        {/* Full Analysis */}
                        <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/green/esg?ticker=${encodeURIComponent(s.ticker)}`)}
                            className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all hover:opacity-80"
                            style={{ background: 'rgba(5,150,105,0.10)', color: '#059669', border: '1px solid rgba(5,150,105,0.20)' }}>
                            ESG Detail →
                          </button>
                        </td>
                      </tr>

                      {/* Expanded ESG notes row */}
                      {isExpanded && (
                        <tr key={`${s.ticker}-notes`} style={{ borderBottom: '1px solid rgba(5,150,105,0.07)', background: tierCfg.bg }}>
                          <td colSpan={11} className="px-6 py-3">
                            <div className="flex items-start gap-4">
                              {/* ESG score bar */}
                              <div className="flex gap-3 flex-shrink-0">
                                {[{ key: 'E', val: s.esgE, label: 'Environmental' }, { key: 'S', val: s.esgS, label: 'Social' }, { key: 'G', val: s.esgG, label: 'Governance' }].map(m => (
                                  <div key={m.key} className="flex flex-col items-center gap-1">
                                    <div className="w-6 rounded-full overflow-hidden" style={{ height: 48, background: 'rgba(0,0,0,0.06)' }}>
                                      <div className="w-full rounded-full transition-all duration-500"
                                        style={{ height: `${((m.val ?? 5) / 10) * 100}%`, marginTop: `${(1 - (m.val ?? 5) / 10) * 100}%`, background: SCORE_COLOR(m.val) }} />
                                    </div>
                                    <span className="text-[9px] font-bold" style={{ color: SCORE_COLOR(m.val) }}>{m.val ?? '–'}</span>
                                    <span className="text-[9px]" style={{ color: '#9CA3AF' }}>{m.key}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Tier + notes */}
                              <div className="flex-1">
                                <div className="text-xs font-bold mb-1" style={{ color: tierCfg.color }}>
                                  {tier} — {tierCfg.desc}
                                </div>
                                {s.esgNotes ? (
                                  <p className="text-xs" style={{ color: '#374151' }}>{s.esgNotes}</p>
                                ) : (
                                  <p className="text-xs italic" style={{ color: '#9CA3AF' }}>
                                    Click <strong>ESG Detail →</strong> for full breakdown and BSE shareholding data.
                                  </p>
                                )}
                              </div>
                              {/* Tier description */}
                              <div className="text-right flex-shrink-0">
                                <div className="text-[10px] mb-1" style={{ color: '#9CA3AF' }}>Transition Risk</div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full"
                                  style={{ background: riskCfg.bg, color: riskCfg.color }}>{s.esgRisk}</span>
                                <div className="text-[9px] mt-2" style={{ color: '#9CA3AF' }}>
                                  BRSR: {s.brsrMandated ? 'SEBI Mandated' : 'Voluntary'}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs" style={{ color: '#6B7280' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
              className="px-4 py-2 rounded-lg disabled:opacity-30 font-medium transition-all"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', color: '#059669' }}>
              ← Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
                const pg = totalPages <= 7 ? idx + 1 : page <= 4 ? idx + 1 : page >= totalPages - 3 ? totalPages - 6 + idx : page - 3 + idx
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
                    style={{ background: page === pg ? '#059669' : 'transparent', color: page === pg ? '#fff' : '#6B7280' }}>
                    {pg}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
              className="px-4 py-2 rounded-lg disabled:opacity-30 font-medium transition-all"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', color: '#059669' }}>
              Next →
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.10)' }}>
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <span className="text-xs font-bold" style={{ color: '#059669' }}>ESG Tiers:</span>
            {Object.entries(TIER_CFG).map(([t, c]) => (
              <span key={t} className="flex items-center gap-1 text-[10px]">
                <span className="font-bold px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{t}</span>
                <span style={{ color: '#9CA3AF' }}>{c.label}</span>
              </span>
            ))}
          </div>
          <div className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
            <strong style={{ color: '#059669' }}>E</strong> = Environmental (carbon, water, waste) ·
            <strong style={{ color: '#059669' }}> S</strong> = Social (workforce, inclusion, access) ·
            <strong style={{ color: '#059669' }}> G</strong> = Governance (board, pledging, disclosure) · Scores 0–10.
            Click any row to expand ESG detail. Click <strong>ESG Detail →</strong> for the full ESG breakdown with live BSE shareholding data.
            G scores are computed from BSE promoter pledging data. E and S scores reflect sector structural research (updated per release).
          </div>
        </div>
      </div>

      {/* Save modal */}
      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSave(false)}>
          <div className="rounded-2xl p-6 shadow-2xl" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', maxWidth: 340, width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-1" style={{ color: '#064E3B' }}>Save Screen</h3>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Saves ESG filters, sector selection, and sort order.</p>
            <input value={saveName} onChange={e => setSaveName(e.target.value)}
              placeholder="e.g. Green Leaders – Large Cap"
              className="w-full text-sm px-3 py-2.5 rounded-xl mb-4 outline-none"
              style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowSave(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }}>Cancel</button>
              <button onClick={saveScreen} disabled={!saveName.trim()}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
