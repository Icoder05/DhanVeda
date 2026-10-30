'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { TERMS_SECTIONS } from '@/lib/terms-content'
import { TERMS_VERSION } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default function AcceptTermsPage() {
  const router = useRouter()
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/accept-terms', { method: 'POST' })
    if (!res.ok) { setLoading(false); setError('Something went wrong. Please try again.'); return }
    // Refresh the JWT so needsTermsAcceptance flips to false immediately —
    // without this the middleware keeps redirecting back here until next sign-in
    await update()
    router.push('/research')
  }

  return (
    <div className="w-full max-w-2xl" style={{ animation: 'dvFadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both' }}>
      <div
        className="rounded-2xl p-8 flex flex-col"
        style={{
          background: 'rgba(16,22,36,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.05) inset',
          maxHeight: '85vh',
        }}
      >
        <div className="mb-5 flex-shrink-0">
          <h1 className="text-xl font-bold text-white mb-1">One last step</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Please review and accept our Terms &amp; Conditions to continue — Version {TERMS_VERSION}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1" style={{ minHeight: 0 }}>
          {TERMS_SECTIONS.map((section, i) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-1.5">{i + 1}. {section.title}</h3>
              {section.body.map((para, j) => (
                <p key={j} className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{para}</p>
              ))}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3 mt-4 flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-5 flex-shrink-0"
          style={{
            background: loading ? 'rgba(16,185,129,0.5)' : '#10b981',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Saving…' : 'I Agree & Continue →'}
        </button>
      </div>
    </div>
  )
}
