'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) setErrorMsg('Invalid or missing reset link. Request a new one.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        setTimeout(() => router.push('/login?verified=1'), 2500)
      } else {
        setErrorMsg(data.error ?? 'Reset failed. Please request a new link.')
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
          <h1 className="text-xl font-bold text-white mb-1">Set new password</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Choose a password you haven't used before</p>
        </div>

        {status === 'done' ? (
          <div>
            <div
              className="rounded-xl px-4 py-4 mb-6 text-sm"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
            >
              <p className="font-semibold mb-1">Password updated!</p>
              <p style={{ color: '#94a3b8' }}>Redirecting you to sign in…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {(errorMsg || !token) && (
              <div
                className="text-sm rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMsg || 'Invalid or missing reset link.'}
              </div>
            )}

            {token && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>New password</label>
                  <PasswordInput
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Confirm password</label>
                  <PasswordInput
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    required
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
                      Updating…
                    </span>
                  ) : 'Update password →'}
                </button>
              </>
            )}
          </form>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 24, paddingTop: 20 }}>
          <p className="text-center text-xs" style={{ color: '#64748b' }}>
            Link expired?{' '}
            <Link href="/forgot-password" className="font-semibold transition-colors" style={{ color: '#10b981' }}>
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
