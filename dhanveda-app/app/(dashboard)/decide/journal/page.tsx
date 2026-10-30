'use client'
import { useState, useEffect } from 'react'

interface Entry { id: number; stock: string; action: string; reason: string; conviction: string; createdAt: string }

const ACTION_COLORS: Record<string, string> = { Buy: '#10B981', Sell: '#DC2626', Hold: '#F59E0B', Watching: '#1E6FA8' }

export default function JournalPage() {
  const [stock, setStock] = useState('')
  const [action, setAction] = useState('Buy')
  const [reason, setReason] = useState('')
  const [conviction, setConviction] = useState('Medium')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [feedback, setFeedback] = useState<any>(null)

  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(d => { if (Array.isArray(d)) setEntries(d) })
  }, [])

  async function save() {
    const s = stock.trim().replace(/[<>"'`{}\\]/g, '').substring(0, 50)
    if (!s || !reason.trim()) { alert('Fill in stock and reasoning.'); return }
    setSaving(true); setFeedback(null)
    const saveRes = await fetch('/api/journal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: s, action, reason, conviction }),
    })
    if (saveRes.ok) {
      const entry = await saveRes.json()
      setEntries(prev => [entry, ...prev])
    }
    setLoading(true)
    const prompt = `Investment coach. Stock:${s}, Action:${action}, Conviction:${conviction}.\nReasoning:"${reason}"\nReply ONLY with JSON:\n{"feedback":"2 direct sentences","reasoning_quality":"Strong","patterns_noticed":"1 sentence","suggestion":"1 sentence"}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 600, feature: 'journal', stock: s }),
      })
      const data = await res.json()
      if (res.ok) setFeedback(data)
    } catch {}
    setLoading(false); setSaving(false)
    setStock(''); setReason('')
  }

  const qColor = (q = '') => q === 'Strong' ? '#10B981' : q === 'Weak' ? '#DC2626' : '#F59E0B'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Conviction Journal</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Log every investment decision and get AI coaching on your reasoning</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">New Journal Entry</div>
          <div className="space-y-3">
            <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock name"
              className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
            <div className="flex gap-2">
              {['Buy', 'Sell', 'Hold', 'Watching'].map(a => (
                <button key={a} onClick={() => setAction(a)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: action === a ? `${ACTION_COLORS[a]}20` : 'transparent', border: `1px solid ${action === a ? ACTION_COLORS[a] : 'rgba(5,150,105,0.15)'}`, color: action === a ? ACTION_COLORS[a] : '#9CA3AF' }}>
                  {a}
                </button>
              ))}
            </div>
            <select value={conviction} onChange={e => setConviction(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}>
              {['Low', 'Medium', 'High', 'Very High'].map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Why are you making this decision? Be specific about your reasoning…"
              rows={5} maxLength={1000}
              className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
            <button onClick={save} disabled={saving || loading || !stock.trim() || !reason.trim()}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white hover:brightness-110 disabled:opacity-50 transition-all"
              style={{ background: '#059669' }}>
              {saving ? 'Saving…' : loading ? 'Getting feedback…' : 'Save & Get AI Coaching →'}
            </button>
          </div>
          {feedback && (
            <div className="mt-4 rounded-xl p-4 anim-in" style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">AI Coach</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${qColor(feedback.reasoning_quality)}18`, color: qColor(feedback.reasoning_quality) }}>
                  {feedback.reasoning_quality}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-3">{feedback.feedback}</p>
              <div className="text-xs text-white/40 space-y-1">
                <div><strong className="text-white/50">Pattern:</strong> {feedback.patterns_noticed}</div>
                <div><strong className="text-white/50">Before you act:</strong> {feedback.suggestion}</div>
              </div>
            </div>
          )}
        </div>
        {/* Entry list */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Your Journal ({entries.length})</div>
          {entries.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-3xl mb-2">📔</div>
              <p className="text-sm text-white/30">No entries yet. Log your first decision.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{e.stock}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${ACTION_COLORS[e.action] ?? '#94a3b8'}18`, color: ACTION_COLORS[e.action] ?? '#94a3b8' }}>
                        {e.action}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">{new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{e.reason.substring(0, 120)}{e.reason.length > 120 ? '…' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


