'use client'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setStatus(res.ok ? 'done' : 'error')
    if (res.ok) setForm({ name: '', email: '', subject: 'General', message: '' })
  }

  const inputCls = 'w-full px-4 py-3 rounded-lg border border-emerald-200 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all bg-white text-gray-700'

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <h1 className="font-serif text-4xl mb-2" style={{ color: '#064E3B' }}>Get in touch</h1>
      <p className="text-gray-400 text-sm mb-8">Questions, feedback, or partnership ideas — we read every message.</p>

      {status === 'done' ? (
        <div className="rounded-xl p-6 bg-emerald-50 border border-emerald-200 text-center">
          <div className="text-2xl mb-2">✓</div>
          <div className="font-semibold text-emerald-700">Message sent!</div>
          <p className="text-sm text-emerald-600 mt-1">We&apos;ll get back to you at {form.email || 'your email'}.</p>
          <button onClick={() => setStatus('idle')} className="mt-4 text-sm text-emerald-600 underline">
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'error' && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Something went wrong. Please try again.
            </div>
          )}
          <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} required className={inputCls} />
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required className={inputCls} />
          <select value={form.subject} onChange={set('subject')} className={inputCls}>
            <option>General</option>
            <option>Feature Request</option>
            <option>Bug Report</option>
            <option>Partnership</option>
            <option>Press</option>
          </select>
          <textarea placeholder="Your message (up to 2000 characters)" value={form.message} onChange={set('message')}
            required maxLength={2000} rows={5} className={inputCls} style={{ resize: 'vertical' }} />
          <button type="submit" disabled={status === 'loading'}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 transition-all disabled:opacity-60"
            style={{ background: '#059669' }}>
            {status === 'loading' ? 'Sending…' : 'Send Message →'}
          </button>
        </form>
      )}

      <div className="mt-10 pt-8 border-t border-emerald-100">
        <p className="text-sm text-gray-400">
          📧 chitakanasrikrishna@gmail.com<br />
          📍 Mumbai, India
        </p>
      </div>
    </div>
  )
}
