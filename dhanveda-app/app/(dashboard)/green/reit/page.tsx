'use client'
import { useState } from 'react'

const REITS = ['Embassy Office Parks REIT', 'Mindspace Business Parks REIT', 'Brookfield India Real Estate Trust', 'Nexus Select Trust', 'Knowledge Realty Trust']

export default function REITPage() {
  const [reit, setReit] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function analyse() {
    const r = reit.trim()
    if (!r) return
    setLoading(true); setResult(null); setError('')
    const prompt = `You are a REIT analyst. Analyse "${r}" through these 4 steps:\n\nSTEP 1 — EXTRACT: Search the web for current data: unit price on NSE, distribution yield %, NAV per unit, occupancy rate %, WALE (weighted average lease expiry in years), debt-to-asset ratio, latest quarterly distribution amount, sponsor name, SEBI compliance status, any LEED or green building certifications.\n\nSTEP 2 — DRAFT: Using ONLY Step 1 data, draft the analysis. Write N/A for anything not found. Never invent a number.\n\nSTEP 3 — SELF-CORRECT: Does the stated yield match the distribution amount and current price found? Is the verdict consistent with occupancy rate and debt levels? Fix any contradiction.\n\nSTEP 4 — OUTPUT: Return ONLY this JSON. No markdown:\n{"name":"Full REIT name","symbol":"NSE symbol","score":72,"yield_assessment":"actual yield % found or N/A","nav_comment":"1 sentence with real NAV per unit","occupancy":"actual % or N/A","wale":"actual years or N/A","debt_to_asset":"actual ratio or N/A","key_strengths":["real data-backed strength 1","strength 2"],"key_risks":["real risk 1"],"esg_note":"1 sentence on green certifications found","verdict":"2 sentences. Buy/Hold/Avoid for income investor."}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 1100, webSearch: true, feature: 'reit', stock: r }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const sc = Math.min(parseInt(result?.score) || 0, 100)
  const scColor = sc >= 70 ? '#10B981' : sc >= 50 ? '#F59E0B' : '#DC2626'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">REIT Intelligence</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>All 5 Indian REITs — yield, occupancy, WALE, and ESG analysis</p>
      </div>
      <div className="mb-4">
        <div className="text-xs text-white/40 mb-2">Quick select Indian REITs</div>
        <div className="flex flex-wrap gap-2">
          {REITS.map(r => (
            <button key={r} onClick={() => setReit(r)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ background: reit === r ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.04)', border: `1px solid ${reit === r ? '#059669' : 'rgba(5,150,105,0.05)'}`, color: reit === r ? '#10B981' : '#94a3b8' }}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <input value={reit} onChange={e => setReit(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && analyse()}
          placeholder="Or type any REIT name…"
          className="flex-1 px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
        <button onClick={analyse} disabled={loading || !reit.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
          style={{ background: '#059669' }}>
          {loading ? 'Analysing…' : 'Analyse →'}
        </button>
      </div>
      {loading && <div className="flex flex-col items-center gap-3 py-12"><div className="dv-spinner" /><div className="text-sm text-white/40">Fetching REIT data…</div></div>}
      {error && !loading && <div className="text-sm text-red-400 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
      {result && !loading && (
        <div className="space-y-4 anim-in">
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{result.name ?? reit}</h2>
                <div className="text-sm text-white/40 mt-0.5">{result.symbol}</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4"
                  style={{ borderColor: scColor, color: scColor, background: `${scColor}15` }}>{sc}</div>
                <div className="text-[10px] text-white/30 mt-1">REIT Score</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[['Occupancy', result.occupancy], ['WALE', result.wale], ['Yield', result.yield_assessment]].map(([label, val]) => (
                <div key={label as string} className="rounded-lg p-3 text-center" style={{ background: '#F0FDF4' }}>
                  <div className="text-xs text-white/30 mb-1">{label}</div>
                  <div className="text-sm font-bold text-emerald-400">{val ?? 'N/A'}</div>
                </div>
              ))}
            </div>
            {result.nav_comment && <p className="text-sm text-white/50 mb-4 leading-relaxed">{result.nav_comment}</p>}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500/60 mb-2">Strengths</div>
                <ul className="space-y-2">{(result.key_strengths ?? []).map((x: string, i: number) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span>{x}</li>)}</ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-red-400/60 mb-2">Risks</div>
                <ul className="space-y-2">{(result.key_risks ?? []).map((x: string, i: number) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-red-400 flex-shrink-0">⚠</span>{x}</li>)}</ul>
                {result.esg_note && <div className="mt-3 text-xs p-2 rounded-lg" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)', color: '#064E3B' }}>🌿 {result.esg_note}</div>}
              </div>
            </div>
          </div>
          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">REIT Verdict</div>
            <p className="text-sm text-white/70 leading-relaxed">{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}


