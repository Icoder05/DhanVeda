'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      if (res.error.includes('email_not_verified')) {
        setError('Email not verified. Run the SQL script to set email_verified = true in Neon.')
      } else if (res.error.includes('account_suspended')) {
        setError('Account is suspended.')
      } else if (res.error.includes('CredentialsSignin')) {
        setError('Wrong password or no password set on this account. Run the SQL reset script.')
      } else {
        setError(`Login failed: ${res.error}`)
      }
    } else {
      router.push('/admin')
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500'
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid #1e2e1e' }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)' }}>
      <Link href="/" className="flex items-center gap-2 justify-center mb-8 hover:opacity-80 transition-opacity">
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:3, borderRadius:9, border:'1px solid rgba(16,185,129,0.3)', boxShadow:'0 0 12px rgba(16,185,129,0.18)', flexShrink:0 }}>
          <img src="/artha-logo.png" alt="" style={{ height: 30, width: 'auto', objectFit: 'contain', borderRadius: 6, display: 'block' }} />
        </div>
        <span className="font-serif text-2xl text-white tracking-tight leading-none">
          Artha<span className="text-yellow-400">Sift</span>
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(14,24,14,0.9)', border: '1px solid #1e2e1e' }}>
        <h1 className="text-lg font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-sm text-white/40 mb-6">Sign in with your admin account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Admin email"
            required
            className={inputCls}
            style={inputStyle}
          />
          <PasswordInput
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className={inputCls}
            inputStyle={inputStyle}
          />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60"
            style={{ background: '#059669' }}>
            {loading ? 'Signing in…' : 'Admin Sign In →'}
          </button>
        </form>
      </div>
    </div>
  )
}
