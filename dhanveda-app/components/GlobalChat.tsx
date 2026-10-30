'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Msg { role: 'user' | 'ai'; text: string }

const SYSTEM = `You are ArthaSift Assistant — a warm, knowledgeable AI guide built into the ArthaSift platform. ArthaSift is India's AI platform for investors and entrepreneurs, powered by a multi-agent Claude AI pipeline.

PLATFORM MAP (use these exact paths in markdown links when navigating):

🚀 Business & Venture (sidebar: Business & Venture):
• Score a new business idea → [New Business Score](/venture/analyze) — 12-dimension analysis using YC/Sequoia criteria, Peter Thiel's Zero-to-One monopoly framework, unit economics, and Blue Ocean Strategy. Returns GO / PIVOT / NO-GO verdict.
• Evaluate deals, acquisitions, JVs → [Deal Analyzer](/venture/deals) — franchise, acquisition, joint venture, merger evaluation with negotiation playbooks and due diligence checklists.
• Create investor documents → [Pitch Studio](/venture/documents) — AI-generated Business Plan, Business Model Canvas, and Pitch Deck with financial charts. PDF-ready.

📊 Research (sidebar: Research):
• Fundamental stock analysis → [T & F Analysis](/research) — 14 KPIs (P/E, P/B, ROE, ROCE, margins, pledging) with real-time web search.
• Earnings call analysis → [Transcript Analyser](/research/transcript) — tone, red flags, management confidence.

🧠 Decision Tools (sidebar: Decide):
• Stress-test your investment thesis → [Thesis Tester](/decide)
• Identify cognitive biases → [Bias Checker](/decide/bias)
• Log and review decisions → [Conviction Journal](/decide/journal)

🌱 Green Finance (sidebar: Green Finance):
• Rooftop solar returns → [Solar Calculator](/green/solar) — 25-year NPV, IRR, PM Surya Ghar subsidy.
• REC market & carbon credits → [Carbon & RECs](/green/carbon)
• All 5 Indian REITs → [REIT Intelligence](/green/reit) — Embassy, Mindspace, Brookfield, Nexus, Knowledge Realty.
• Filter stocks by ESG → [ESG Screener](/green/screener)

💼 My Money (sidebar: My Money):
• Portfolio health check → [Portfolio](/money) — score, rebalancing advice, SIP suggestions.
• Investor & founder community → [Community & Network](/money/community) — share views, AI synthesis.
• Investing & business lessons → [Learn](/money/learn) — structured modules with quizzes.

RESPONSE RULES:
1. Be warm, friendly, and professional. Always reply helpfully.
2. Keep replies under 110 words unless a detailed explanation is genuinely needed.
3. When directing to a feature, include the markdown link [Label](/path) so it becomes clickable.
4. Answer questions about investing, Indian markets (NSE/BSE/₹), personal finance, entrepreneurship, business valuation, and anything the user asks.
5. Frame investment content as education — not SEBI-registered personal advice.
6. For greetings like "hi" or "hello", introduce yourself and ask what you can help with today.
7. Reply ONLY as valid JSON, no markdown fences: {"response":"your answer here"}`

const SUGGESTIONS = [
  'What can ArthaSift do?',
  'Score my business idea',
  'Analyse an NSE stock',
  'How does VentureIQ work?',
]

function renderMsg(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      return (
        <Link key={i} href={m[2]} style={{ color: '#059669', fontWeight: 600, textDecoration: 'underline' }}>
          {m[1]}
        </Link>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function GlobalChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: "Hi! I'm your ArthaSift Assistant 👋 I can help you navigate the platform, answer questions about investing or business, and guide you to the right tool. What would you like to explore?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    const updated: Msg[] = [...msgs, { role: 'user', text: q }]
    setMsgs(updated)
    setInput('')
    setLoading(true)

    const history = updated.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
    const prompt = `${SYSTEM}\n\nConversation:\n${history}\n\nAssistant (JSON only, no markdown): {"response":"..."}`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 420, feature: 'assistant' }),
      })
      const data = await res.json()
      const text: string = typeof data === 'string'
        ? data
        : (data.response ?? data.text ?? JSON.stringify(data))
      setMsgs(prev => [...prev, { role: 'ai', text }])
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: 'Sorry, I had a hiccup. Please try again in a moment.' }])
    }
    setLoading(false)
  }

  const hasUnread = !open && msgs.length > 1

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          width: 360,
          background: '#ffffff',
          border: '1px solid rgba(5,150,105,0.2)',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(5,150,105,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Header */}
          <div style={{ background: '#022C22', borderBottom: '1px solid rgba(217,119,6,0.18)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>ArthaSift Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Online · Ask me anything</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FFF8', maxHeight: 340, minHeight: 180 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#022C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 7, flexShrink: 0, marginTop: 2 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '82%',
                  padding: '8px 12px',
                  fontSize: 12,
                  lineHeight: 1.65,
                  borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  ...(m.role === 'user'
                    ? { background: '#059669', color: '#fff' }
                    : { background: '#fff', color: '#374151', border: '1px solid rgba(5,150,105,0.12)' }),
                }}>
                  {m.role === 'ai' ? renderMsg(m.text) : m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#022C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginRight: 7, flexShrink: 0 }}>🤖</div>
                <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid rgba(5,150,105,0.12)', borderRadius: '14px 14px 14px 3px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => (
                    <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: `dvPulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick suggestions — show only at conversation start */}
          {msgs.length <= 1 && (
            <div style={{ padding: '8px 12px 6px', background: '#F0FDF4', borderTop: '1px solid rgba(5,150,105,0.08)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#374151', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid rgba(5,150,105,0.1)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything about ArthaSift…"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 12, fontSize: 12, outline: 'none', background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#059669' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(5,150,105,0.2)' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{ padding: '8px 14px', borderRadius: 12, background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.45 : 1, boxShadow: '0 2px 8px rgba(5,150,105,0.3)', flexShrink: 0, transition: 'opacity 0.2s' }}
            >
              {loading ? '…' : '→'}
            </button>
          </div>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 18px',
          borderRadius: 22, fontWeight: 600, fontSize: 13, color: '#fff',
          background: '#022C22',
          boxShadow: '0 8px 28px rgba(2,44,34,0.4)',
          border: '1px solid rgba(217,119,6,0.3)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 16 }}>🤖</span>
        {open ? 'Close' : 'AS Assistant'}
        {hasUnread && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', position: 'absolute', top: -2, right: -2, border: '2px solid #022C22' }} />
        )}
      </button>
    </div>
  )
}
