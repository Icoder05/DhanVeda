'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setStatus('sent')
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-sm" style={{ animation: 'dvFadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both' }}>
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'rgba(16,22,36,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div className="mb-7">
          <h1 className="text-xl font-bold text-white mb-1">Reset password</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Enter your email and we'll send a reset link
          </p>
        </div>

        {status === 'sent' ? (
          <div>
            <div
              className="rounded-xl px-4 py-4 mb-6 text-sm"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
            >
              <p className="font-semibold mb-1">Check your inbox</p>
              <p style={{ color: '#94a3b8' }}>
                If <span className="font-medium text-white">{email}</span> is registered, a password
                reset link has been sent. It expires in 1 hour.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl font-semibold text-sm text-center text-white transition-all"
              style={{ background: '#10b981', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {status === 'error' && (
              <div
                className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="dv-input"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-1"
              style={{
                background: status === 'loading' ? 'rgba(16,185,129,0.5)' : '#10b981',
                boxShadow: status === 'loading' ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending…
                </span>
              ) : 'Send reset link →'}
            </button>
          </form>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 24, paddingTop: 20 }}>
          <p className="text-center text-xs" style={{ color: '#64748b' }}>
            Remembered it?{' '}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: '#10b981' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
