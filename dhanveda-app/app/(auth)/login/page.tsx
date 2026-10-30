'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)

  useEffect(() => {
    const err = searchParams.get('error')
    const verified = searchParams.get('verified')
    const tokenError = searchParams.get('error')

    if (verified === '1') {
      setInfo('Email verified! You can now sign in.')
    } else if (err === 'email_not_verified') {
      setError('Please verify your email before signing in. Check your inbox.')
    } else if (err === 'invalid_token' || err === 'token_expired') {
      setError('Verification link is invalid or expired. Request a new one below.')
    } else if (err) {
      setError('Sign-in failed. Please try again.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!userId || !password) { setError('Please enter your User ID and password.'); return }
    setLoading(true)
    const res = await signIn('credentials', { userId, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      if (res.error.includes('account_suspended')) {
        setError('This account has been suspended. Contact support for assistance.')
      } else if (res.error.includes('email_not_verified')) {
        setError('Please verify your email before signing in. Check your inbox.')
      } else {
        setError('Incorrect User ID or password.')
      }
    } else {
      router.push('/research')
    }
  }

  async function handleOAuth(provider: 'google') {
    setOauthLoading('google')
    await signIn(provider, { callbackUrl: '/research' })
  }

  return (
    <div className="w-full max-w-sm animate-[dvFadeUp_0.35s_ease_both]" style={{ animation: 'dvFadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both' }}>
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'rgba(16,22,36,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.05) inset',
        }}
      >
        <div className="mb-7">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Sign in to your research desk</p>
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            onClick={() => GOOGLE_ENABLED && handleOAuth('google')}
            disabled={!!oauthLoading || !GOOGLE_ENABLED}
            title={!GOOGLE_ENABLED ? 'Google sign-in is not configured yet' : undefined}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: !GOOGLE_ENABLED ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
              cursor: (oauthLoading || !GOOGLE_ENABLED) ? 'not-allowed' : 'pointer',
            }}
          >
            {oauthLoading === 'google' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ opacity: GOOGLE_ENABLED ? 1 : 0.3 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {GOOGLE_ENABLED ? 'Sign in with Google' : 'Google (not configured)'}
          </button>

        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs" style={{ color: '#475569' }}>or continue with User ID</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {info && (
            <div
              className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {info}
            </div>
          )}

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

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. srikrishna24"
              required
              autoComplete="username"
              spellCheck={false}
              className="dv-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>Password</label>
              <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: '#10b981' }}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-1"
            style={{
              background: loading ? 'rgba(16,185,129,0.5)' : '#10b981',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In →'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 24, paddingTop: 20 }}>
          <p className="text-center text-xs" style={{ color: '#64748b' }}>
            No account?{' '}
            <Link href="/signup" className="font-semibold transition-colors" style={{ color: '#10b981' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Admin?{' '}
        <Link href="/admin/login" className="hover:underline" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Admin login
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
