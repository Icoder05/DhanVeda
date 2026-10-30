'use client'
import { useState } from 'react'

export default function ThesisPage() {
  const [stock, setStock] = useState('')
  const [thesis, setThesis] = useState('')
  const [period, setPeriod] = useState('12 months')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function run() {
    if (!thesis.trim()) { alert('Write your thesis.'); return }
    setLoading(true); setResult(null); setError('')
    const s = stock.trim().replace(/[<>"'`{}\\]/g, '').substring(0, 50)
    const prompt = `You are a fund manager stress-testing an investment thesis for a ${period} investment horizon. Work through these 4 steps:\n\nSTEP 1 — EXTRACT: Search the web for current data on "${s || 'this stock'}": recent price action, latest quarterly results, any news from the past 90 days, analyst consensus if available, and key risks currently flagged by the market.\n\nSTEP 2 — DRAFT: Evaluate this investor thesis (investment horizon: ${period}) against Step 1 data: "${thesis}". Identify genuine strengths supported by data, real holes in the logic, and bear counterarguments the market is currently pricing in. Tailor your analysis to the ${period} time horizon — short-term risks matter more for 3–6 month horizons, while fundamental moat and compounding matter more for multi-year holds.\n\nSTEP 3 — SELF-CORRECT: Is each hole specific to this thesis or just generic market risk? Does the conviction score reflect the actual number and severity of holes found? Is the verdict consistent with the conviction score and the ${period} horizon? Fix all inconsistencies.\n\nSTEP 4 — OUTPUT: Return ONLY this JSON. No markdown:\n{"conviction_score":68,"strengths":["strength backed by data 1","strength 2"],"holes":["specific hole in this thesis 1","hole 2"],"bear_counterarguments":["market-priced risk 1","risk 2"],"key_assumptions":["assumption 1","assumption 2"],"what_could_break_thesis":["specific trigger 1"],"monitoring_metrics":["metric to track 1","metric 2"],"verdict":"2-3 sentences. Conviction score must match the holes count and severity. Reference the ${period} horizon."}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 1400, webSearch: true, feature: 'thesis', stock: s }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const cs = Math.min(parseInt(result?.conviction_score) || 0, 100)
  const csColor = cs >= 70 ? '#10B981' : cs >= 45 ? '#F59E0B' : '#DC2626'

  const cardStyle = { background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }
  const inputStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid rgba(5,150,105,0.2)',
    color: '#064E3B',
    outline: 'none',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Thesis Stress-Tester</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Write your investment thesis — AI finds the holes before you invest</p>
      </div>

      <div className="rounded-xl p-5 mb-4 space-y-3" style={cardStyle}>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="Stock name (optional)"
            className="px-4 py-3 rounded-xl text-sm placeholder-gray-400 focus:ring-1 focus:ring-emerald-500"
            style={inputStyle}
          />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
            style={inputStyle}
          >
            {['3 months', '6 months', '12 months', '2 years', '5 years'].map(p => (
              <option key={p} style={{ background: '#fff' }}>{p}</option>
            ))}
          </select>
        </div>
        <textarea
          value={thesis}
          onChange={e => setThesis(e.target.value)}
          placeholder="Write your bull case thesis here… e.g. 'I believe Infosys will outperform because of its strong deal wins, margin recovery, and undervaluation vs peers.'"
          rows={6}
          maxLength={1500}
          className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 resize-y"
          style={inputStyle}
        />
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{thesis.length} / 1500</span>
          <button
            onClick={run}
            disabled={loading || !thesis.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
            style={{ background: '#059669' }}
          >
            {loading ? 'Stress-Testing…' : 'Stress Test →'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="dv-spinner" />
          <div className="text-sm" style={{ color: '#64748b' }}>Finding holes in your thesis…</div>
        </div>
      )}

      {error && !loading && (
        <div className="text-sm p-4 rounded-xl" style={{ color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 anim-in">
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Conviction Score', `${cs}/100`, csColor],
              ['Holes Found', String(result.holes?.length ?? 0), '#DC2626'],
              ['Assumptions', String(result.key_assumptions?.length ?? 0), '#F59E0B'],
            ].map(([label, val, color]) => (
              <div key={label} className="rounded-xl p-4 text-center" style={cardStyle}>
                <div className="text-2xl font-bold" style={{ color }}>{val}</div>
                <div className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-3">Strengths</div>
              <ul className="space-y-2">
                {(result.strengths ?? []).map((x: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: '#94a3b8' }}>
                    <span className="text-emerald-500 flex-shrink-0">✓</span>{x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Holes in Thesis</div>
              <ul className="space-y-2">
                {(result.holes ?? []).map((x: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: '#94a3b8' }}>
                    <span className="text-red-400 flex-shrink-0">✗</span>{x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#60a5fa' }}>Counter-Arguments</div>
              <ul className="space-y-2">
                {(result.bear_counterarguments ?? []).map((x: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: '#94a3b8' }}>
                    <span className="flex-shrink-0" style={{ color: '#60a5fa' }}>→</span>{x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#fbbf24' }}>Metrics to Monitor</div>
              <ul className="space-y-2">
                {(result.monitoring_metrics ?? []).map((x: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: '#94a3b8' }}>
                    <span className="flex-shrink-0" style={{ color: '#fbbf24' }}>•</span>{x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Thesis Verdict</div>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}
