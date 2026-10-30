'use client'
import { useState } from 'react'

export default function CarbonPage() {
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function analyse() {
    const s = stock.trim().replace(/[<>"'`{}\\]/g, '').substring(0, 50)
    if (!s) return
    setLoading(true); setResult(null); setError('')
    const prompt = `You are a carbon and ESG analyst. Analyse the carbon position of Indian listed company "${s}" through these 4 steps:\n\nSTEP 1 — EXTRACT: Search the web for: annual CO2 or GHG emissions reported, renewable energy % in operations, REC certificates generated or purchased annually, net zero target year (if any), BRSR or sustainability report disclosures, BEE PAT scheme status, any carbon credit trading activity on IEX, green or clean revenue percentage of total revenue.\n\nSTEP 2 — DRAFT: Using ONLY Step 1 data, draft the carbon position analysis. Do not invent emissions figures.\n\nSTEP 3 — SELF-CORRECT: Is the position label actually supported by Step 1 data? Does the regulatory risk match the company type? Fix all issues.\n\nSTEP 4 — OUTPUT: Return ONLY this JSON. No markdown:\n{"company":"str","carbon_position":"Net Generator","position_score":72,"rec_status":"actual REC status found or N/A","regulatory_risk":"Low","regulatory_note":"1 sentence with real data","green_revenue_pct":"actual % or N/A","carbon_revenue_upside":"1 sentence","transition_note":"1 sentence on net-zero commitment found or None disclosed","investment_angle":"1-2 sentences based on real data","verdict":"2 sentences."}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 1100, webSearch: true, feature: 'carbon', stock: s }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const posColor = (p = '') => p === 'Net Generator' ? '#10B981' : p === 'Net Buyer' ? '#DC2626' : '#F59E0B'
  const riskColor = (r = '') => r === 'Low' ? '#10B981' : r === 'High' ? '#DC2626' : '#F59E0B'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Carbon & RECs Analysis</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Carbon position, REC status, regulatory risk and green revenue for any NSE stock</p>
      </div>

      {/* India carbon market info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['REC Price',      '₹347/MWh',   'IEX — live auctions',     '#F59E0B'],
          ['India Carbon Mkt','ICM Pilot',  'CCTS 2023 — pre-2026',    '#F59E0B'],
          ['PAT Scheme',     'BEE Active',  'Compliance trading live',  '#10B981'],
          ['BRSR Mandate',   'FY2022–23+',  'SEBI top-1000 cos.',       '#94a3b8'],
        ].map(([label, val, sub, color]) => (
          <div key={label as string} className="rounded-xl p-3 text-center" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-xs text-white/30 mb-0.5">{label}</div>
            <div className="text-sm font-bold" style={{ color: color as string }}>{val}</div>
            <div className="text-[10px] text-white/20">{sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <input value={stock} onChange={e => setStock(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && analyse()}
          placeholder="Enter NSE stock to analyse carbon position (e.g. NTPC, Reliance, Tata Power)"
          className="flex-1 px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
        <button onClick={analyse} disabled={loading || !stock.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
          style={{ background: '#059669' }}>
          {loading ? 'Analysing…' : 'Analyse →'}
        </button>
      </div>
      {loading && <div className="flex flex-col items-center gap-3 py-12"><div className="dv-spinner" /><div className="text-sm text-white/40">Fetching carbon data…</div></div>}
      {error && !loading && <div className="text-sm text-red-400 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
      {result && !loading && (
        <div className="space-y-4 anim-in">
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{result.company ?? stock}</h2>
                <div className="text-xs text-white/30 mt-0.5">Carbon Position</div>
              </div>
              <div className="text-sm font-bold px-3 py-1.5 rounded-lg"
                style={{ color: posColor(result.carbon_position), background: `${posColor(result.carbon_position)}18`, border: `1px solid ${posColor(result.carbon_position)}33` }}>
                {result.carbon_position}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                ['Carbon Score', `${result.position_score ?? '—'}/100`, posColor(result.carbon_position)],
                ['Regulatory Risk', result.regulatory_risk ?? 'N/A', riskColor(result.regulatory_risk)],
                ['Green Revenue', result.green_revenue_pct ?? 'N/A', '#F59E0B'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="rounded-lg p-3 text-center" style={{ background: '#F0FDF4' }}>
                  <div className="text-xs text-white/30 mb-1">{label}</div>
                  <div className="text-sm font-bold" style={{ color: color as string }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500/60 mb-2">REC Status</div>
                <p className="text-sm text-white/60">{result.rec_status ?? 'N/A'}</p>
                {result.carbon_revenue_upside && (
                  <div className="mt-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', color: '#064E3B' }}>
                    <strong>Revenue Upside:</strong> {result.carbon_revenue_upside}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-red-400/60 mb-2">Regulatory Risk</div>
                <p className="text-sm text-white/60">{result.regulatory_note ?? 'N/A'}</p>
                {result.transition_note && (
                  <div className="mt-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)', color: '#064E3B' }}>
                    <strong>Net Zero:</strong> {result.transition_note}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.12)' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Investment Angle</div>
              <p className="text-sm" style={{ color: '#374151' }}>{result.investment_angle}</p>
            </div>
          </div>
          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Carbon Verdict</div>
            <p className="text-sm text-white/70 leading-relaxed">{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}

