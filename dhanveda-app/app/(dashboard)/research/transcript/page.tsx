'use client'
import { useState } from 'react'

export default function TranscriptPage() {
  const [company, setCompany] = useState('')
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function analyse() {
    if (!transcript.trim()) { alert('Paste a transcript first.'); return }
    setLoading(true); setResult(null); setError('')
    const prompt = `Equity analyst. Transcript for "${company || 'company'}".\nReply ONLY with JSON:\n{"company":"str","overall_tone":"Bullish","tone_reasoning":"1-2 sentences","green_flags":["g1","g2"],"red_flags":["r1","r2"],"key_numbers":["k1","k2"],"management_confidence":"High","hidden_concerns":["h1"],"verdict":"2-3 sentences"}\nTRANSCRIPT:\n${transcript.substring(0, 5000)}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 1200, feature: 'transcript', stock: company }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const toneColor = (t = '') => t === 'Bullish' ? '#10B981' : t === 'Bearish' ? '#DC2626' : '#F59E0B'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Earnings Transcript Analyser</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Paste any earnings call transcript — get tone, flags, key numbers and verdict</p>
      </div>
      <div className="rounded-xl p-5 mb-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
        <input value={company} onChange={e => setCompany(e.target.value)}
          placeholder="Company name (optional)"
          className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 mb-3"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
          placeholder="Paste earnings call transcript here (up to 5,000 characters will be analysed)…"
          rows={10} maxLength={8000}
          className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
        <div className="flex items-center justify-between mt-3">
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{transcript.length} / 8000 chars</span>
          <button onClick={analyse} disabled={loading || !transcript.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
            style={{ background: '#059669' }}>
            {loading ? 'Analysing…' : 'Analyse Transcript →'}
          </button>
        </div>
      </div>
      {loading && <div className="flex flex-col items-center gap-3 py-12"><div className="dv-spinner" /><div className="text-sm text-white/40">Reading transcript…</div></div>}
      {error && !loading && <div className="text-sm text-red-400 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
      {result && !loading && (
        <div className="space-y-4 anim-in">
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-white">{result.company ?? company ?? 'Transcript'}</h2>
                <div className="text-sm text-white/40 mt-0.5">Transcript Analysis</div>
              </div>
              <div className="text-sm font-bold px-3 py-1.5 rounded-lg"
                style={{ color: toneColor(result.overall_tone), background: `${toneColor(result.overall_tone)}18`, border: `1px solid ${toneColor(result.overall_tone)}33` }}>
                {result.overall_tone}
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">{result.tone_reasoning}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-3">Green Flags</div>
              <ul className="space-y-2">{(result.green_flags ?? []).map((f: string, i: number) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span>{f}</li>)}</ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Red Flags</div>
              <ul className="space-y-2">{(result.red_flags ?? []).map((f: string, i: number) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-red-400 flex-shrink-0">⚠</span>{f}</li>)}</ul>
            </div>
          </div>
          {result.key_numbers?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-yellow-500/70 mb-3">Key Numbers</div>
              <div className="flex flex-wrap gap-2">{result.key_numbers.map((n: string, i: number) => <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)', color: '#F59E0B' }}>{n}</span>)}</div>
            </div>
          )}
          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Verdict</div>
            <p className="text-sm text-white/70 leading-relaxed">{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}


