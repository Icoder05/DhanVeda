import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TwoFAToggle from './TwoFAToggle'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as any

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)',
          borderRadius: 100, padding: '5px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, letterSpacing: '.08em' }}>ACCOUNT SETTINGS</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#064E3B', marginBottom: 6, lineHeight: 1.2 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
          Manage your account, security and platform preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Account ── */}
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', letterSpacing: '.06em', textTransform: 'uppercase' }}>Account</span>
          </div>

          <div style={{ padding: '4px 20px 8px' }}>
            {[
              ['Name', user.name ?? '—'],
              ['Email', user.email ?? '—'],
              ['Investor Type', user.investorType ?? 'Retail Investor'],
              ['Risk Tolerance', user.riskTolerance ?? 'Moderate'],
              ['Investment Horizon', user.investmentHorizon ?? '5+ years'],
            ].map(([label, value], i, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(5,150,105,0.07)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#064E3B' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2FA ── */}
        <TwoFAToggle />

        {/* ── Platform Info ── */}
        <div style={{
          background: '#ffffff', border: '1px solid rgba(5,150,105,0.18)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(5,150,105,0.07)',
        }}>
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
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', letterSpacing: '.06em', textTransform: 'uppercase' }}>Platform Info</span>
          </div>

          <div style={{ padding: '4px 20px 8px' }}>
            {[
              ['Version', 'v1.0'],
              ['AI Model', 'Gemini 2.0 Flash (primary)'],
              ['Database', 'Neon PostgreSQL'],
              ['Auth', 'NextAuth v5'],
              ['Deployment', 'Vercel'],
            ].map(([label, value], i, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(5,150,105,0.07)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#059669',
                  background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
                  borderRadius: 20, padding: '2px 10px',
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
            ArthaSift is for educational purposes only. Not SEBI-registered investment advice. Always consult a SEBI-registered advisor before investing.
          </span>
        </div>

      </div>
    </div>
  )
}
