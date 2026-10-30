'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const NAV = [
  {
    category: 'Research',
    emoji: '📊',
    items: [
      { label: 'T & F Analysis', href: '/research' },
      { label: 'Transcript Analyser', href: '/research/transcript' },
    ],
  },
  {
    category: 'Decide',
    emoji: '🧠',
    items: [
      { label: 'Thesis Tester', href: '/decide' },
      { label: 'Bias Checker', href: '/decide/bias' },
      { label: 'Conviction Journal', href: '/decide/journal' },
    ],
  },
  {
    category: 'Green Finance',
    emoji: '🌱',
    items: [
      { label: 'Green Hub', href: '/green' },
      { label: 'Solar Calculator', href: '/green/solar' },
      { label: 'Carbon & RECs', href: '/green/carbon' },
      { label: 'REIT Intelligence', href: '/green/reit' },
      { label: 'ESG Screener', href: '/green/screener' },
      { label: 'ESG Score', href: '/green/esg' },
    ],
  },
  {
    category: 'Business & Venture',
    emoji: '🚀',
    items: [
      { label: 'New Business Investment', href: '/venture/analyze' },
      { label: 'Acquisition & Partnership', href: '/venture/deals' },
      { label: 'Pitch Studio', href: '/venture/documents' },
    ],
  },
  {
    category: 'My Money',
    emoji: '💼',
    items: [
      { label: 'Portfolio', href: '/money' },
      { label: 'Community & Network', href: '/money/community' },
      { label: 'Learn', href: '/money/learn' },
    ],
  },
]

interface Props {
  userName: string
  userInitial: string
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ userName, userInitial, isOpen, onToggle }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>('Research')

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 flex flex-col z-40"
      style={{
        background: '#022C22',
        borderRight: '1px solid rgba(217,119,6,0.2)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
    >
      {/* Logo + hamburger */}
      <div
        className="h-14 flex items-center px-3 flex-shrink-0 gap-2"
        style={{ borderBottom: '1px solid rgba(217,119,6,0.15)' }}
      >
        {/* Hamburger toggle */}
        <button
          onClick={onToggle}
          aria-label="Close navigation"
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: 'transparent',
            border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(16,185,129,0.1)'
            el.style.borderColor = 'rgba(16,185,129,0.4)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.borderColor = 'rgba(16,185,129,0.15)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <line x1="2" y1="3.5"  x2="13" y2="3.5"  stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="2" y1="7.5"  x2="13" y2="7.5"  stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="2" y1="11.5" x2="13" y2="11.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity" style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:3, borderRadius:9, border:'1px solid rgba(16,185,129,0.28)', boxShadow:'0 0 10px rgba(16,185,129,0.18), inset 0 0 6px rgba(16,185,129,0.06)', flexShrink:0 }}>
            <img src="/artha-logo.png" alt="" style={{ height: 26, width: 'auto', objectFit: 'contain', borderRadius: 6, display: 'block' }} />
          </div>
          <div className="flex flex-col" style={{ minWidth: 0 }}>
            <span className="font-bold text-[15px] tracking-tight leading-none">
              <span className="text-white">Artha</span><span style={{ color: '#10b981' }}>Sift</span>
            </span>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '.06em', fontWeight: 600, textTransform: 'uppercase', marginTop: 3, lineHeight: 1.2 }}>
              Channelising Investments
            </span>
          </div>
        </Link>
      </div>

      {/* User strip */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(217,119,6,0.15)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))',
            border: '1.5px solid rgba(16,185,129,0.4)',
          }}
        >
          {userInitial}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {userName}
          </div>
          <div className="text-[10px] font-medium" style={{ color: '#10b981', opacity: 0.7 }}>
            Research Desk
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
        {NAV.map((section) => {
          const isOpen = open === section.category
          const sectionActive = section.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))

          return (
            <div key={section.category} className="mb-0.5 px-3">
              <button
                onClick={() => setOpen(isOpen ? null : section.category)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors"
                style={{
                  color: sectionActive ? '#10b981' : 'rgba(255,255,255,0.4)',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  if (!sectionActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                }}
                onMouseLeave={e => {
                  if (!sectionActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
                  <span className="text-sm">{section.emoji}</span>
                  {section.category}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.5,
                  }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-1 space-y-0.5">
                  {section.items.map((item) => {
                    const isCurrent = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 pl-6 pr-3 py-1.5 rounded-lg text-sm transition-all duration-150"
                        style={{
                          color: isCurrent ? '#10b981' : 'rgba(255,255,255,0.45)',
                          background: isCurrent ? 'rgba(16,185,129,0.1)' : 'transparent',
                          fontWeight: isCurrent ? 600 : 400,
                          boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(16,185,129,0.2)' : 'none',
                        }}
                        onMouseEnter={e => {
                          if (!isCurrent) {
                            const el = e.currentTarget as HTMLElement
                            el.style.color = 'rgba(255,255,255,0.75)'
                            el.style.background = 'rgba(255,255,255,0.04)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isCurrent) {
                            const el = e.currentTarget as HTMLElement
                            el.style.color = 'rgba(255,255,255,0.45)'
                            el.style.background = 'transparent'
                          }
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: isCurrent ? '#10b981' : 'rgba(255,255,255,0.2)' }}
                        />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className="p-3 flex flex-col gap-0.5 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(217,119,6,0.15)' }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'rgba(255,255,255,0.65)'
            el.style.background = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'rgba(255,255,255,0.35)'
            el.style.background = 'transparent'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = '#f87171'
            el.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'rgba(255,255,255,0.35)'
            el.style.background = 'transparent'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
