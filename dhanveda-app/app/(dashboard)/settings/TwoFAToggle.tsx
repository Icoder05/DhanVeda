'use client'
import { useState, useEffect } from 'react'

export default function TwoFAToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/settings/2fa')
      .then(r => r.json())
      .then(d => setEnabled(d.enabled ?? false))
      .finally(() => setLoading(false))
  }, [])

  async function toggle() {
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/settings/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: !enabled }),
    })
    const data = await res.json()
    if (res.ok) {
      setEnabled(data.enabled)
      setMessage(data.enabled ? '2FA enabled. Your next login will require a code.' : '2FA disabled.')
    } else {
      setMessage(data.error ?? 'Failed to update 2FA setting.')
    }
    setSaving(false)
  }

  return (
    <div style={{
      background: '#ffffff', border: '1px solid rgba(5,150,105,0.18)',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(5,150,105,0.07)',
    }}>
      {/* Card header stripe */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(5,150,105,0.1)',
        background: 'rgba(5,150,105,0.04)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', letterSpacing: '.06em', textTransform: 'uppercase' }}>Security</span>
      </div>

      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#064E3B', margin: '0 0 4px' }}>Two-step verification</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              Require a 6-digit email code on every login.
            </p>
          </div>

          <button
            onClick={toggle}
            disabled={loading || saving}
            style={{
              position: 'relative', flexShrink: 0,
              width: 44, height: 24, borderRadius: 12,
              background: enabled ? '#059669' : 'rgba(5,150,105,0.15)',
              border: `1.5px solid ${enabled ? '#059669' : 'rgba(5,150,105,0.3)'}`,
              cursor: loading || saving ? 'not-allowed' : 'pointer',
              opacity: loading || saving ? 0.6 : 1,
              transition: 'background 0.2s, border-color 0.2s',
            }}
            aria-label={enabled ? 'Disable 2FA' : 'Enable 2FA'}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: enabled ? 22 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: enabled ? '#fff' : '#059669',
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            }} />
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 12, marginTop: 12, color: enabled ? '#059669' : '#6B7280' }}>
            {message}
          </p>
        )}

        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)',
          fontSize: 12, color: '#6B7280', lineHeight: 1.6,
        }}>
          When enabled, a one-time code is sent to your email each time you sign in with your password. Google OAuth logins bypass 2FA automatically.
        </div>
      </div>
    </div>
  )
}
