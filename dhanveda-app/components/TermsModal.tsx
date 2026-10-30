'use client'
import { useEffect, useRef, useState } from 'react'
import { TERMS_SECTIONS } from '@/lib/terms-content'
import { TERMS_VERSION } from '@/lib/schema'

interface TermsModalProps {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export default function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setScrolledToBottom(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = bodyRef.current
    if (el && el.scrollHeight <= el.clientHeight) {
      setScrolledToBottom(true)
    }
  }, [open])

  function handleScroll() {
    const el = bodyRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setScrolledToBottom(true)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full"
        style={{
          maxWidth: 600, maxHeight: '80vh',
          background: 'rgba(16,22,36,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-base font-bold text-white">Terms &amp; Conditions</h2>
            <p className="text-xs" style={{ color: '#64748b' }}>Version {TERMS_VERSION}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-lg" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} onScroll={handleScroll} style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }} className="flex flex-col gap-5">
          {TERMS_SECTIONS.map((section, i) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-1.5">{i + 1}. {section.title}</h3>
              {section.body.map((para, j) => (
                <p key={j} className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{para}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            className="text-xs font-medium"
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Close
          </button>
          {scrolledToBottom ? (
            <button
              onClick={() => { onAccept(); onClose() }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: '#10b981', boxShadow: '0 4px 16px rgba(16,185,129,0.25)', cursor: 'pointer' }}
            >
              I Agree
            </button>
          ) : (
            <span className="text-xs" style={{ color: '#64748b' }}>Scroll to the end to enable</span>
          )}
        </div>
      </div>
    </div>
  )
}
