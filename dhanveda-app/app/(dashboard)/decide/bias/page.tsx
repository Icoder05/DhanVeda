'use client'
import { useState } from 'react'

export default function BiasPage() {
  const [stock, setStock] = useState('')
  const [reason, setReason] = useState('')
  const [emotion, setEmotion] = useState('Excited')
  const [duration, setDuration] = useState('1 week')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function check() {
    if (!reason.trim()) { alert('Write your reasoning.'); return }
    setLoading(true); setResult(null); setError('')
    const s = stock.trim().replace(/[<>"'`{}\\]/g, '').substring(0, 50)
    const prompt = `Behavioural finance expert. Decision for "${s || 'a stock'}".\nReasoning:"${reason}"\nEmotion:${emotion}\nDuration:${duration}\nReply ONLY with JSON:\n{"biases_detected":["bias name:explanation"],"fomo_score":72,"fomo_reasoning":"1 sentence","logic_score":45,"logic_reasoning":"1 sentence","emotional_risk":"High","recommendation":"2 sentences","questions_to_ask_yourself":["q1","q2","q3"]}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 1000, feature: 'bias', stock: s }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }
  const fomo = Math.min(parseInt(result?.fomo_score) || 0, 100)
  const logic = Math.min(parseInt(result?.logic_score) || 0, 100)
  const fomoColor = fomo > 65 ? '#DC2626' : fomo > 35 ? '#F59E0B' : '#10B981'
  const logicColor = logic > 65 ? '#10B981' : logic > 35 ? '#F59E0B' : '#DC2626'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Investment Bias Checker</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Detect FOMO and emotional biases before you invest</p>
      </div>
      <div className="rounded-xl p-5 mb-4 space-y-3" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock name (optional)"
            className="px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none" style={inputStyle} />
          <select value={emotion} onChange={e => setEmotion(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
            {['Excited', 'Nervous', 'Confident', 'Fearful', 'FOMO', 'Calm', 'Greedy'].map(e => <option key={e}>{e}</option>)}
          </select>
          <select value={duration} onChange={e => setDuration(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
            {['Today', '3 days', '1 week', '2 weeks', '1 month', '3 months'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Describe your reasoning for this investment decision…"
          rows={5} maxLength={800}
          className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
          style={inputStyle} />
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{reason.length} / 800</span>
          <button onClick={check} disabled={loading || !reason.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
            style={{ background: '#059669' }}>
            {loading ? 'Checking…' : 'Check Biases →'}
          </button>
        </div>
      </div>
      {loading && <div className="flex flex-col items-center gap-3 py-12"><div className="dv-spinner" /><div className="text-sm text-white/40">Analysing your reasoning…</div></div>}
      {error && !loading && <div className="text-sm text-red-400 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
      {result && !loading && (
        <div className="grid md:grid-cols-2 gap-4 anim-in">
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-red-400/70 mb-4">Biases Detected</div>
            {(result.biases_detected ?? []).length > 0 ? (result.biases_detected as string[]).map((b: string, i: number) => {
              const [name, ...rest] = b.split(':')
              return (
                <div key={i} className="py-3 last:border-0" style={{ borderBottom: '1px solid rgba(5,150,105,0.1)' }}>
                  <div className="text-sm font-semibold text-red-400">{name}</div>
                  {rest.length > 0 && <div className="text-xs text-white/40 mt-1">{rest.join(':')}</div>}
                </div>
              )
            }) : <p className="text-sm text-white/30">No strong biases found.</p>}
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-white/50">FOMO Level</span><span className="font-semibold" style={{ color: fomoColor }}>{fomo}%</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${fomo}%`, background: fomoColor }} /></div>
                <div className="text-xs text-white/30 mt-1">{result.fomo_reasoning}</div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-white/50">Logic Score</span><span className="font-semibold" style={{ color: logicColor }}>{logic}%</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${logic}%`, background: logicColor }} /></div>
                <div className="text-xs text-white/30 mt-1">{result.logic_reasoning}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400/70 mb-4">Questions to Ask Yourself</div>
            <ul className="space-y-3">
              {(result.questions_to_ask_yourself ?? []).map((q: string, i: number) => (
                <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-yellow-500/50 flex-shrink-0 font-bold">{i + 1}.</span>{q}</li>
              ))}
            </ul>
            <div className="verdict-box mt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">AI Coach</div>
              <p className="text-sm text-white/70 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


