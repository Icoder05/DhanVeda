'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') ?? ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [resentMsg, setResentMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function handleDigitInput(i: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = char
    setDigits(next)
    setError('')
    if (char && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) submitOtp(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    setError('')
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === 6) submitOtp(pasted)
  }

  async function submitOtp(otp: string) {
    if (loading || !email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Verification failed. Please try again.')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login?verified=1'), 1200)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (resending || cooldown > 0 || !email) return
    setResending(true)
    setResentMsg('')
    setError('')
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResentMsg('New code sent! Check your inbox.')
      setCooldown(60)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const filled = digits.filter(Boolean).length

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
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: success ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
            border: `1.5px solid ${success ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            {success ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
              </svg>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-2 text-center">
          {success ? 'Email verified!' : 'Check your email'}
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          {success
            ? 'Your account is ready. Redirecting to sign in…'
            : <>We sent a 6-digit code to{' '}<strong style={{ color: '#e2e8f0' }}>{email || 'your email'}</strong></>
          }
        </p>

        {!success && (
          <>
            {/* OTP boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  style={{
                    width: 44, height: 52,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    borderRadius: 10,
                    border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : d ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    background: d ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
                    color: '#f1f5f9',
                    outline: 'none',
                    caretColor: '#10b981',
                    transition: 'border-color 0.15s, background 0.15s',
                    cursor: loading ? 'not-allowed' : 'text',
                  }}
                />
              ))}
            </div>

            {/* Progress hint */}
            {!error && !resentMsg && filled > 0 && filled < 6 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                {6 - filled} digit{6 - filled !== 1 ? 's' : ''} remaining
              </p>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
              </div>
            )}

            {/* Resent confirmation */}
            {resentMsg && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#10b981', marginBottom: 12 }}>{resentMsg}</p>
            )}

            {/* Manual submit (fallback if auto-submit fails) */}
            {filled === 6 && !loading && (
              <button
                onClick={() => submitOtp(digits.join(''))}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 12, marginBottom: 16,
                  background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 14,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                }}
              >
                Verify →
              </button>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span style={{ fontSize: 13, color: '#64748b' }}>Verifying…</span>
              </div>
            )}

            {/* Resend */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Didn't receive it? </span>
              {cooldown > 0 ? (
                <span style={{ fontSize: 13, color: '#334155' }}>Resend in {cooldown}s</span>
              ) : (
                <button
                  onClick={resend}
                  disabled={resending}
                  style={{ fontSize: 13, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 10 }}>
              Code expires in 15 minutes · Check spam if not in inbox
            </p>
          </>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 24, paddingTop: 18, textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
