'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function VerifyOtpPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    setError('')
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    for (let i = 0; i < 6; i++) next[i] = text[i] ?? ''
    setOtp(next)
    const nextFocus = Math.min(text.length, 5)
    inputRefs.current[nextFocus]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Verification failed.')
        setLoading(false)
        return
      }

      // Re-authenticate with the HMAC bypass token to clear pending2FA from the session
      const loginRes = await signIn('credentials', {
        userId: data.userId,
        bypassToken: data.bypassToken,
        redirect: false,
      })

      if (loginRes?.error) {
        setError('Session error. Please log in again.')
        router.push('/login')
      } else {
        router.push('/research')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function resendOtp() {
    if (resending) return
    setResending(true)
    setResent(false)
    try {
      await fetch('/api/auth/resend-otp', { method: 'POST' })
      setResent(true)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const userEmail = session?.user?.email

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
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.25)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Two-step verification</h1>
          <p className="text-sm" style={{ color: '#64748b', lineHeight: 1.5 }}>
            We emailed a 6-digit code to{' '}
            {userEmail ? <strong style={{ color: '#94a3b8' }}>{userEmail}</strong> : 'your email'}.
            {' '}Enter it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* OTP digit inputs */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="text-center text-xl font-bold text-white rounded-xl transition-all"
                style={{
                  width: 44,
                  height: 52,
                  background: 'rgba(255,255,255,0.04)',
                  border: digit
                    ? '1.5px solid rgba(16,185,129,0.5)'
                    : '1.5px solid rgba(255,255,255,0.1)',
                  outline: 'none',
                }}
              />
            ))}
          </div>

          {error && (
            <div
              className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {resent && (
            <p className="text-sm text-center" style={{ color: '#10b981' }}>New code sent to your email.</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{
              background: loading || otp.join('').length < 6 ? 'rgba(16,185,129,0.4)' : '#10b981',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
              cursor: loading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Verifying…
              </span>
            ) : 'Verify →'}
          </button>

          <p className="text-center text-xs" style={{ color: '#64748b' }}>
            Didn't receive it?{' '}
            <button
              type="button"
              onClick={resendOtp}
              disabled={resending}
              style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
