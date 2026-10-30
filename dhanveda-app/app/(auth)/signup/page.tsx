'use client'
import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TermsModal from '@/components/TermsModal'
import PasswordInput from '@/components/PasswordInput'
import { TERMS_VERSION } from '@/lib/schema'

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true'
const USERID_RE = /^[a-z][a-z0-9_]{2,19}$/

function suggestUserId(name: string): string {
  const base = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 15)
  if (!base) return ''
  const num = Math.floor(Math.random() * 90) + 10
  return `${base}${num}`
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', userId: '', investorType: 'Retail Investor' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsUnlocked, setTermsUnlocked] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  // userId availability state
  const [userIdStatus, setUserIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [userIdMsg, setUserIdMsg] = useState('')
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIdSuggested = useRef(false)

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value
      setForm(f => ({ ...f, [k]: val }))
      if (k === 'userId') checkUserIdDebounced(val)
    }
  }

  // Auto-suggest userId when name is filled
  useEffect(() => {
    if (form.name.length >= 2 && !userIdSuggested.current && !form.userId) {
      const suggestion = suggestUserId(form.name)
      if (suggestion) {
        userIdSuggested.current = true
        setForm(f => ({ ...f, userId: suggestion }))
        checkUserIdDebounced(suggestion)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name])

  function checkUserIdDebounced(id: string) {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    const trimmed = id.toLowerCase().trim()
    if (!trimmed) { setUserIdStatus('idle'); setUserIdMsg(''); return }
    if (!USERID_RE.test(trimmed)) {
      setUserIdStatus('invalid')
      setUserIdMsg('3–20 chars, start with a letter, letters/numbers/underscores only.')
      return
    }
    setUserIdStatus('checking')
    setUserIdMsg('')
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-userid?id=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.available) {
          setUserIdStatus('available'); setUserIdMsg('Available')
        } else {
          setUserIdStatus('taken'); setUserIdMsg('User ID already exists.')
        }
      } catch {
        setUserIdStatus('idle'); setUserIdMsg('')
      }
    }, 450)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.userId) { setError('Please fill in all fields.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!USERID_RE.test(form.userId.toLowerCase())) { setError('Invalid User ID format.'); return }
    if (userIdStatus === 'taken') { setError('User ID already exists. Please choose another.'); return }
    if (!termsAccepted) { setError('Please accept the Terms & Conditions to continue.'); return }

    setLoading(true)
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: form.userId.toLowerCase(), termsAccepted, termsVersion: TERMS_VERSION }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Signup failed.'); setLoading(false); return }
    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`)
  }

  async function handleOAuth(provider: 'google') {
    setOauthLoading('google')
    await signIn(provider, { callbackUrl: '/research' })
  }

  const INVESTOR_TYPES = [
    'Retail Investor',
    'HNI (High Net Worth)',
    'Active Trader',
    'Long-term Investor',
    'ESG-Focused Investor',
  ]

  const statusColor = userIdStatus === 'available' ? '#10b981' : userIdStatus === 'taken' || userIdStatus === 'invalid' ? '#f87171' : '#64748b'
  const statusIcon =
    userIdStatus === 'available' ? '✓' :
    userIdStatus === 'taken' || userIdStatus === 'invalid' ? '✗' :
    userIdStatus === 'checking' ? '…' : ''

  return (
    <div className="w-full max-w-sm" style={{ animation: 'dvFadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both' }}>
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
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Free early access · No credit card needed</p>
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
            {GOOGLE_ENABLED ? 'Continue with Google' : 'Google (not configured)'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs" style={{ color: '#475569' }}>or sign up with email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Full name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Ravi Sharma" required className="dv-input" />
          </div>

          {/* User ID field */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              User ID
              <span style={{ color: '#475569', fontWeight: 400, marginLeft: 6 }}>— your unique handle (e.g. ravi24)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={form.userId}
                onChange={set('userId')}
                placeholder="ravi24"
                required
                className="dv-input"
                style={{
                  paddingRight: 36,
                  borderColor: userIdStatus === 'available' ? 'rgba(16,185,129,0.5)' :
                               userIdStatus === 'taken' || userIdStatus === 'invalid' ? 'rgba(248,113,113,0.5)' : undefined,
                }}
                autoComplete="off"
                spellCheck={false}
              />
              {statusIcon && (
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: userIdStatus === 'checking' ? 11 : 14,
                  fontWeight: 700,
                  color: statusColor,
                  pointerEvents: 'none',
                }}>
                  {statusIcon}
                </span>
              )}
            </div>
            {userIdMsg && (
              <p style={{ fontSize: 11, marginTop: 5, color: statusColor }}>
                {userIdMsg}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email address</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className="dv-input" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Password</label>
            <PasswordInput
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Investor type</label>
            <div className="relative">
              <select value={form.investorType} onChange={set('investorType')} className="dv-input dv-select pr-9">
                {INVESTOR_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: '#161c2a', color: '#f1f5f9' }}>{t}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}
                width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="flex items-start gap-2.5 -mt-1">
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={!termsUnlocked}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5"
              style={{ accentColor: '#10b981', cursor: termsUnlocked ? 'pointer' : 'not-allowed' }}
            />
            <label className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={{ color: '#10b981', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              >
                Terms &amp; Conditions
              </button>
              {!termsUnlocked && <span style={{ color: '#475569' }}> (read to unlock)</span>}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted || userIdStatus === 'taken' || userIdStatus === 'invalid'}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-1"
            style={{
              background: (loading || !termsAccepted || userIdStatus === 'taken' || userIdStatus === 'invalid')
                ? 'rgba(16,185,129,0.5)' : '#10b981',
              boxShadow: (loading || !termsAccepted || userIdStatus === 'taken' || userIdStatus === 'invalid')
                ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
              cursor: (loading || !termsAccepted || userIdStatus === 'taken' || userIdStatus === 'invalid')
                ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'dvSpin 0.75s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Creating account…
              </span>
            ) : 'Create Account →'}
          </button>
        </form>

        <TermsModal
          open={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={() => { setTermsUnlocked(true); setTermsAccepted(true) }}
        />

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 24, paddingTop: 20 }}>
          <p className="text-center text-xs" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#10b981' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
