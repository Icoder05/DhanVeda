'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import FeedbackWidget from '@/components/FeedbackWidget'
import GlobalChat from '@/components/GlobalChat'

export default function DashboardShell({
  children,
  userName,
  userInitial,
}: {
  children: React.ReactNode
  userName: string
  userInitial: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex min-h-screen" style={{ background: '#F0FDF4' }}>
      <Sidebar
        userName={userName}
        userInitial={userInitial}
        isOpen={open}
        onToggle={() => setOpen(o => !o)}
      />

      {/* Floating hamburger — only visible when sidebar is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          style={{
            position: 'fixed',
            top: 13,
            left: 14,
            zIndex: 50,
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#022C22',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="2" y1="4"  x2="14" y2="4"  stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="8"  x2="14" y2="8"  stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="12" x2="14" y2="12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Main content — slides right with sidebar */}
      <div
        style={{
          marginLeft: open ? 224 : 0,
          transition: 'margin-left 0.25s ease',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <main className="flex-1 overflow-y-auto p-6 dv-main">{children}</main>
      </div>

      <FeedbackWidget />
      <GlobalChat />
    </div>
  )
}
