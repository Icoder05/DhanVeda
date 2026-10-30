'use client'
import { useState } from 'react'

const CATEGORIES = ['General', 'Bug', 'Feature Request'] as const
type Category = typeof CATEGORIES[number]

const CAT_COLORS: Record<Category, string> = {
  'General':         'rgba(99,102,241,0.8)',
  'Bug':             'rgba(239,68,68,0.85)',
  'Feature Request': 'rgba(16,185,129,0.85)',
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('General')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setTitle('')
    setDescription('')
    setCategory('General')
    setError('')
    setDone(false)
  }

  function close() {
    setOpen(false)
    setTimeout(reset, 300)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title: title.trim(), description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Submission failed.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); reset() }}
        title="Send feedback"
        style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          zIndex: 49,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          borderRadius: 99,
          background: 'rgba(14,24,14,0.92)',
          border: '1px solid rgba(99,102,241,0.35)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(199,210,254,0.85)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = 'rgba(99,102,241,0.7)'
          el.style.boxShadow = '0 4px 24px rgba(99,102,241,0.2)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = 'rgba(99,102,241,0.35)'
          el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Modal panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 148,
            right: 24,
            zIndex: 999,
            width: 340,
            borderRadius: 16,
            background: 'rgba(12,20,12,0.97)',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
            animation: 'dvFadeUp 0.2s cubic-bezier(0.4,0,0.2,1) both',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>Send Feedback</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0' }}>Report a bug, request a feature, or share a thought</p>
            </div>
            <button onClick={close} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>Thank you!</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>Your feedback has been received. We'll review it shortly.</p>
                <button onClick={close} style={{ padding: '9px 24px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: category === cat ? `${CAT_COLORS[cat]}22` : 'rgba(255,255,255,0.04)',
                        border: category === cat ? `1px solid ${CAT_COLORS[cat]}` : '1px solid rgba(255,255,255,0.08)',
                        color: category === cat ? CAT_COLORS[cat] : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {cat === 'Bug' ? '🐛' : cat === 'Feature Request' ? '✨' : '💬'} {cat}
                    </button>
                  ))}
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Brief summary…"
                    maxLength={120}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Details</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the issue or idea in detail…"
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                  />
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 10,
                    background: loading ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.85)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? 'Sending…' : 'Send Feedback →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
