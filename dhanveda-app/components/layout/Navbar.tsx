'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 md:px-12"
      style={{ background: 'rgba(2,44,34,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(217,119,6,0.2)' }}>
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:3, borderRadius:9, border:'1px solid rgba(16,185,129,0.28)', boxShadow:'0 0 10px rgba(16,185,129,0.18), inset 0 0 6px rgba(16,185,129,0.06)', flexShrink:0 }}>
          <img src="/artha-logo.png" alt="" style={{ height: 30, width: 'auto', objectFit: 'contain', borderRadius: 6, display: 'block' }} />
        </div>
        <span className="font-serif text-xl text-white tracking-tight leading-none">
          Artha<span className="text-yellow-500">Sift</span>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-7">
        {[['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/pricing', 'Pricing'], ['/contact', 'Contact']].map(([href, label]) => (
          <Link key={href} href={href} className="text-sm text-white/60 hover:text-yellow-400 font-medium transition-colors">
            {label}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <Link href="/login"
          className="text-sm font-semibold text-yellow-500 border border-yellow-600/40 px-4 py-2 rounded-lg hover:bg-yellow-500/10 transition-colors">
          Log In
        </Link>
        <Link href="/signup"
          className="text-sm font-semibold text-white bg-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
          Get Started Free
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden text-white/70 text-2xl" onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div className="absolute top-16 inset-x-0 md:hidden flex flex-col gap-1 py-4 px-6"
          style={{ background: '#022C22', borderBottom: '1px solid rgba(217,119,6,0.15)' }}>
          {[['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/pricing', 'Pricing'], ['/contact', 'Contact']].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="py-2 text-sm text-white/70 hover:text-yellow-400 font-medium">
              {label}
            </Link>
          ))}
          <div className="flex gap-3 mt-3">
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-semibold text-yellow-500 border border-yellow-600/40 py-2 rounded-lg">
              Log In
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-semibold text-white bg-emerald-700 py-2 rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
