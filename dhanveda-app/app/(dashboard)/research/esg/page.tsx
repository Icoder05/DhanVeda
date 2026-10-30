'use client'
import { useState } from 'react'

interface ESGResult {
  company?: string; overall_rating?: string; overall_score?: number;
  env_score?: number; env_highlights?: string[]; env_concerns?: string[];
  soc_score?: number; soc_highlights?: string[]; soc_concerns?: string[];
  gov_score?: number; gov_highlights?: string[]; gov_concerns?: string[];
  brsr_status?: string; carbon_exposure?: string; carbon_note?: string;
  net_zero_target?: string; esg_trend?: string; esg_verdict?: string;
}

export default function ESGPage() {
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ESGResult | null>(null)
  const [error, setError] = useState('')

  async function analyse() {
    const s = stock.trim()
    if (!s) return
    setLoading(true); setResult(null); setError('')
    const prompt = `You are an ESG analyst with live web search. STEP 1 — Search the web for: "${s} ESG score BRSR report sustainability 2024 2025 environmental social governance India". STEP 2 — Search for: "${s} carbon emissions net zero target SEBI disclosure". STEP 3 — Output ONLY a valid JSON object using real data found. No markdown, no text before or after.\n{"company":"str","overall_rating":"Leader","overall_score":72,"env_score":75,"env_highlights":["real finding 1","real finding 2"],"env_concerns":["real concern 1"],"soc_score":68,"soc_highlights":["real finding 1"],"soc_concerns":["real concern 1"],"gov_score":80,"gov_highlights":["real finding 1"],"gov_concerns":["real concern 1"],"brsr_status":"Compliant","carbon_exposure":"Low","carbon_note":"1 sentence with real data","net_zero_target":"year if found","esg_trend":"Improving","esg_verdict":"2 sentences on ESG investment angle."}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 2000, webSearch: true, feature: 'esg', stock: s }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const overallColor = (r = '') => r === 'Leader' || r === 'Performer' ? '#10B981' : r === 'Laggard' || r === 'Risk' ? '#DC2626' : '#F59E0B'
  const trendColor = (t = '') => t === 'Improving' ? '#10B981' : t === 'Deteriorating' ? '#DC2626' : '#F59E0B'
  const carbonColor = (c = '') => c === 'Low' ? '#10B981' : c === 'High' ? '#DC2626' : '#F59E0B'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">ESG Score Checker</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Environmental, Social & Governance analysis powered by live web search</p>
      </div>
      <div className="flex gap-3 mb-6">
        <input value={stock} onChange={e => setStock(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && analyse()}
          placeholder="Enter NSE stock name (e.g. Infosys, TCS, NTPC)"
          className="flex-1 px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
        <button onClick={analyse} disabled={loading || !stock.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
          style={{ background: '#059669' }}>
          {loading ? 'Checking…' : 'Check ESG →'}
        </button>
      </div>
      {loading && <div className="flex flex-col items-center gap-3 py-16"><div className="dv-spinner" /><div className="text-sm text-white/40">Fetching ESG data…</div></div>}
      {error && !loading && <div className="text-sm text-red-400 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
      {result && !loading && (
        <div className="space-y-4 anim-in">
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{result.company ?? stock}</h2>
                <div className="text-sm text-white/40 mt-0.5">ESG Analysis</div>
              </div>
              <div className="text-sm font-bold px-3 py-1.5 rounded-lg" style={{ color: overallColor(result.overall_rating), background: `${overallColor(result.overall_rating)}18`, border: `1px solid ${overallColor(result.overall_rating)}33` }}>
                {result.overall_rating} · {result.overall_score ?? '—'}/100
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[['Environmental', result.env_score, '#10B981'], ['Social', result.soc_score, '#1E6FA8'], ['Governance', result.gov_score, '#D97706']].map(([label, score, color]) => (
                <div key={label as string} className="rounded-lg p-3" style={{ background: '#F0FDF4' }}>
                  <div className="text-3xl font-bold" style={{ color: color as string }}>{score ?? '—'}</div>
                  <div className="text-xs text-white/40 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Environmental', icon: '🌍', color: '#10B981', highlights: result.env_highlights, concerns: result.env_concerns?.[0] },
              { label: 'Social', icon: '👥', color: '#1E6FA8', highlights: result.soc_highlights, concerns: result.soc_concerns?.[0] },
              { label: 'Governance', icon: '⚖️', color: '#D97706', highlights: result.gov_highlights, concerns: result.gov_concerns?.[0] },
            ].map(sec => (
              <div key={sec.label} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: sec.color }}>{sec.icon} {sec.label}</div>
                <ul className="space-y-2 mb-3">
                  {(sec.highlights ?? []).map((h, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2"><span style={{ color: sec.color }} className="flex-shrink-0">✓</span>{h}</li>
                  ))}
                </ul>
                {sec.concerns && (
                  <div className="text-xs p-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', color: '#f87171' }}>
                    ⚠ {sec.concerns}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['BRSR', result.brsr_status, 'white'],
              ['Carbon', result.carbon_exposure, carbonColor(result.carbon_exposure)],
              ['Net Zero', result.net_zero_target, 'white'],
              ['ESG Trend', result.esg_trend, trendColor(result.esg_trend)],
            ].map(([label, val, color]) => (
              <div key={label as string} className="rounded-xl p-3 text-center" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
                <div className="text-[10px] text-white/30 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-sm font-semibold" style={{ color: color as string }}>{val ?? 'N/A'}</div>
              </div>
            ))}
          </div>

          {result.carbon_note && (
            <div className="text-sm p-3 rounded-xl" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}>
              🌿 <strong>Carbon:</strong> {result.carbon_note}
            </div>
          )}
          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">ESG Verdict</div>
            <p className="text-sm text-white/70 leading-relaxed">{result.esg_verdict ?? 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  )
}


