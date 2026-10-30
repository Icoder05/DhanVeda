'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SECTOR_BASE, COMPANY_E_OVERRIDES } from '@/lib/esgScoring'

const TIER_CFG: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
  'A+': { color: '#047857', bg: '#ECFDF5', border: '#6EE7B7', label: 'Green Leader',   desc: 'Exemplary ESG — core business drives the green transition' },
  'A':  { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', label: 'Low Carbon',      desc: 'Low environmental footprint, strong sustainability practices' },
  'B+': { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'ESG Positive',    desc: 'Strong social or governance dimension, improving environment' },
  'B':  { color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', label: 'ESG Moderate',    desc: 'Meets baseline ESG standards, limited significant risks' },
  'C':  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'ESG Developing',  desc: 'Material environmental impact, some mitigation underway' },
  'D':  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'ESG Laggard',     desc: 'High carbon or governance risk, significant transition exposure' },
}

const RISK_CFG: Record<string, { color: string; bg: string }> = {
  'Very Low':  { color: '#047857', bg: 'rgba(4,120,87,0.08)'    },
  'Low':       { color: '#059669', bg: 'rgba(5,150,105,0.08)'   },
  'Medium':    { color: '#D97706', bg: 'rgba(217,119,6,0.08)'   },
  'High':      { color: '#DC2626', bg: 'rgba(220,38,38,0.08)'   },
  'Very High': { color: '#991B1B', bg: 'rgba(153,27,27,0.08)'   },
}

const SCORE_COLOR = (v: number | null) => {
  if (v === null) return '#9CA3AF'
  if (v >= 8) return '#047857'
  if (v >= 6) return '#059669'
  if (v >= 4) return '#D97706'
  return '#DC2626'
}

const SCORE_LABEL = (v: number | null) => {
  if (v === null) return 'N/A'
  if (v >= 8) return 'Strong'
  if (v >= 6) return 'Good'
  if (v >= 4) return 'Moderate'
  return 'Weak'
}

interface StockESG {
  ticker: string; name: string; exchange: string; sector: string | null
  industry: string | null; marketCap: string | null
  esgE: number | null; esgS: number | null; esgG: number | null
  esgTier: string | null; esgRisk: string | null
  brsrMandated: boolean | null; esgNotes: string | null; esgUpdatedAt: string | null
  promoterHolding: number | null; promoterPledge: number | null
  bseCode: string | null; shareholdingDate: string | null
}

function ScoreBar({ label, score, sublabel, context }: { label: string; score: number | null; sublabel: string; context: string }) {
  const color = SCORE_COLOR(score)
  const pct   = score !== null ? (score / 10) * 100 : 0
  return (
    <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.12)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold" style={{ color: '#064E3B' }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sublabel}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>{score ?? '–'}<span className="text-sm font-normal" style={{ color: '#9CA3AF' }}>/10</span></div>
          <div className="text-xs font-semibold" style={{ color }}>{SCORE_LABEL(score)}</div>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'rgba(5,150,105,0.08)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{context}</p>
    </div>
  )
}

function ESGPageContent() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const [ticker, setTicker] = useState(searchParams.get('ticker') ?? '')
  const [input, setInput]   = useState(searchParams.get('ticker') ?? '')
  const [stock, setStock]   = useState<StockESG | null>(null)
  const [loading, setLoading]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]   = useState('')

  const fetchESG = useCallback(async (t: string) => {
    if (!t) return
    setLoading(true); setError(''); setStock(null)
    try {
      const r = await fetch(`/api/screener/esg?ticker=${encodeURIComponent(t.toUpperCase())}`)
      const d = await r.json()
      if (d.error) setError(d.error)
      else setStock(d)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = searchParams.get('ticker')
    if (t) { setTicker(t); setInput(t); fetchESG(t) }
  }, [searchParams, fetchESG])

  async function refreshFromBSE() {
    if (!stock) return
    setRefreshing(true)
    try {
      const r = await fetch('/api/screener/bse-refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: stock.ticker }),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else { await fetchESG(stock.ticker) }
    } catch (e: any) { setError(e.message) }
    setRefreshing(false)
  }

  function search() {
    const t = input.trim().toUpperCase()
    if (!t) return
    setTicker(t)
    router.push(`/green/esg?ticker=${encodeURIComponent(t)}`, { scroll: false })
    fetchESG(t)
  }

  const tier    = stock?.esgTier ?? 'B'
  const tierCfg = TIER_CFG[tier] ?? TIER_CFG['B']
  const riskCfg = RISK_CFG[stock?.esgRisk ?? 'Medium'] ?? RISK_CFG['Medium']
  const sectorBase = SECTOR_BASE[stock?.sector ?? '']
  const hasBSE  = !!(stock?.bseCode)
  const hasBSEData = stock?.promoterPledge !== null && stock?.promoterPledge !== undefined

  return (
    <div className="max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => router.push('/green/screener')}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.15)' }}>
          ← ESG Screener
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#064E3B' }}>ESG Score Detail</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Sector matrix + live BSE shareholding data</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="NSE ticker (e.g. TCS, INFY, ADANIGREEN)"
          className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-shadow focus:shadow-md"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}
        />
        <button onClick={search}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
          View ESG
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="dv-spinner" />
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Loading ESG data for {ticker}…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl p-4 text-sm mb-4"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!stock && !loading && !error && (
        <div className="text-center py-20">
          <div style={{ fontSize: 48 }}>🌿</div>
          <p className="text-sm mt-3" style={{ color: '#9CA3AF' }}>Enter an NSE ticker above to view detailed ESG scores.</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>You can also reach this page from the ESG Screener → Full Analysis.</p>
        </div>
      )}

      {/* ESG Detail */}
      {stock && !loading && (
        <div className="space-y-4">

          {/* Company header card */}
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: `2px solid ${tierCfg.border}`, boxShadow: `0 4px 24px ${tierCfg.color}18` }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#064E3B' }}>{stock.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>{stock.ticker}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{stock.exchange}</span>
                  {stock.marketCap && <span className="text-xs" style={{ color: '#9CA3AF' }}>{stock.marketCap} Cap</span>}
                  {stock.sector && <span className="text-xs" style={{ color: '#9CA3AF' }}>· {stock.sector}</span>}
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex flex-col items-center px-5 py-3 rounded-xl"
                  style={{ background: tierCfg.bg, border: `1px solid ${tierCfg.border}` }}>
                  <span className="text-3xl font-black" style={{ color: tierCfg.color }}>{tier}</span>
                  <span className="text-xs font-semibold mt-0.5" style={{ color: tierCfg.color }}>{tierCfg.label}</span>
                </div>
              </div>
            </div>

            <p className="text-xs mt-3 pt-3" style={{ color: '#6B7280', borderTop: `1px solid ${tierCfg.border}` }}>
              {tierCfg.desc}
            </p>
          </div>

          {/* E / S / G score bars */}
          <div className="grid md:grid-cols-3 gap-3">
            <ScoreBar
              label="Environmental"
              score={stock.esgE}
              sublabel="Carbon · Water · Waste"
              context={
                COMPANY_E_OVERRIDES[stock.ticker]
                  ? `Company-specific: ${stock.ticker} has a materially different environmental profile from its sector peers.`
                  : `Sector baseline (${stock.sector ?? 'General'}): reflects industry-average carbon intensity and resource use.`
              }
            />
            <ScoreBar
              label="Social"
              score={stock.esgS}
              sublabel="Workforce · Inclusion · Access"
              context={`Sector baseline (${stock.sector ?? 'General'}): reflects workforce quality, health impact, and community outcomes typical of this industry.`}
            />
            <ScoreBar
              label="Governance"
              score={stock.esgG}
              sublabel="Board · Pledge · Disclosure"
              context={
                hasBSEData
                  ? `BSE data: Promoter holding ${stock.promoterHolding?.toFixed(1) ?? '–'}%, Pledge ${stock.promoterPledge?.toFixed(1) ?? '–'}% of holding. G score computed from live data.`
                  : `Sector baseline governance (${stock.sector ?? 'General'}). No BSE shareholding data mapped — add BSE code to update from live data.`
              }
            />
          </div>

          {/* Risk + BRSR + Shareholding */}
          <div className="grid md:grid-cols-2 gap-3">

            {/* Transition Risk */}
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.12)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#059669' }}>Transition Risk</div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ background: riskCfg.bg, color: riskCfg.color }}>{stock.esgRisk ?? '–'}</span>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Risk of value loss as India transitions to 500 GW renewable energy by 2030.
                </div>
              </div>
              <div className="mt-3 text-xs p-2.5 rounded-lg" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.10)' }}>
                <strong style={{ color: '#059669' }}>Risk factors:</strong>
                <span style={{ color: '#6B7280' }}> Sector structural exposure + E score (E≤2 increases risk) + Governance quality (high pledge + low G increases risk).</span>
              </div>
            </div>

            {/* BRSR + Shareholding */}
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.12)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#059669' }}>BRSR & Shareholding</div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded`}
                  style={{
                    background: stock.brsrMandated ? 'rgba(5,150,105,0.10)' : 'rgba(156,163,175,0.10)',
                    color: stock.brsrMandated ? '#059669' : '#9CA3AF',
                  }}>
                  BRSR: {stock.brsrMandated ? 'SEBI Mandated (Top-1000)' : 'Voluntary'}
                </span>
              </div>
              {hasBSEData ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#6B7280' }}>Promoter Holding</span>
                    <span className="font-semibold" style={{ color: '#064E3B' }}>{stock.promoterHolding?.toFixed(2) ?? '–'}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#6B7280' }}>Promoter Pledge</span>
                    <span className="font-semibold" style={{
                      color: (stock.promoterPledge ?? 0) > 20 ? '#DC2626' : (stock.promoterPledge ?? 0) > 5 ? '#D97706' : '#059669',
                    }}>
                      {stock.promoterPledge?.toFixed(2) ?? '–'}%
                      {(stock.promoterPledge ?? 0) > 20 && <span className="ml-1 text-[10px]">⚠ High</span>}
                    </span>
                  </div>
                  {stock.shareholdingDate && (
                    <div className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
                      Source: BSE India · Quarter: {stock.shareholdingDate}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {hasBSE ? 'BSE code mapped. Click Refresh from BSE to fetch shareholding.' : 'No BSE code mapped for this ticker.'}
                </p>
              )}
            </div>
          </div>

          {/* Sector comparison */}
          {sectorBase && (
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.12)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#059669' }}>
                vs {stock.sector} Sector Average
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { key: 'E', label: 'Environmental', company: stock.esgE, sector: sectorBase.e },
                  { key: 'S', label: 'Social', company: stock.esgS, sector: sectorBase.s },
                  { key: 'G', label: 'Governance', company: stock.esgG, sector: null },
                ].map(m => {
                  const diff = m.sector !== null && m.company !== null ? m.company - m.sector : null
                  return (
                    <div key={m.key} className="rounded-lg p-3" style={{ background: 'rgba(5,150,105,0.03)' }}>
                      <div className="font-bold text-base mb-1" style={{ color: SCORE_COLOR(m.company) }}>{m.company ?? '–'}</div>
                      <div style={{ color: '#9CA3AF' }}>{m.label}</div>
                      {m.sector !== null && diff !== null && (
                        <div className="text-[10px] mt-1 font-semibold"
                          style={{ color: diff > 0 ? '#059669' : diff < 0 ? '#DC2626' : '#9CA3AF' }}>
                          {diff > 0 ? `+${diff}` : diff === 0 ? '= avg' : String(diff)} vs sector
                        </div>
                      )}
                      {m.sector === null && (
                        <div className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>BSE-derived</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {stock.esgNotes && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.10)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#059669' }}>ESG Note</div>
              <p className="text-sm" style={{ color: '#374151' }}>{stock.esgNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {hasBSE && (
              <button onClick={refreshFromBSE} disabled={refreshing}
                className="text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.20)' }}>
                {refreshing ? 'Fetching BSE data…' : '↻ Refresh from BSE'}
              </button>
            )}
            <button onClick={() => router.push('/green/screener')}
              className="text-sm px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB' }}>
              ← Back to Screener
            </button>
          </div>

          {/* Data freshness */}
          <div className="text-[10px] text-center pt-2" style={{ color: '#9CA3AF' }}>
            ESG scores: sector-structural (E, S) + BSE shareholding–adjusted (G). Algorithm version v1.0 · June 2026.
            {stock.esgUpdatedAt && ` · Last BSE fetch: ${new Date(stock.esgUpdatedAt).toLocaleDateString('en-IN')}`}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ESGPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-3 py-24">
        <div className="dv-spinner" />
        <span className="text-sm" style={{ color: '#9CA3AF' }}>Loading ESG score…</span>
      </div>
    }>
      <ESGPageContent />
    </Suspense>
  )
}
