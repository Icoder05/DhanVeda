import Link from 'next/link'
import { TERMS_SECTIONS } from '@/lib/terms-content'
import { TERMS_VERSION } from '@/lib/schema'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide"
        style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#059669' }}>
        Legal
      </div>
      <h1 className="font-serif text-4xl mb-3" style={{ color: '#064E3B' }}>
        Terms &amp; Conditions
      </h1>
      <p className="text-sm mb-10" style={{ color: '#6B7280' }}>
        Last updated: 1 July 2026 · Version {TERMS_VERSION}
      </p>

      <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed space-y-8 text-[15px]">
        {TERMS_SECTIONS.map((section, i) => (
          <section key={section.title}>
            <h2 className="font-serif text-xl mb-2" style={{ color: '#064E3B' }}>
              {i + 1}. {section.title}
            </h2>
            {section.body.map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-10 flex gap-4">
        <Link href="/signup"
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 transition-all"
          style={{ background: '#059669' }}>
          Back to Sign Up
        </Link>
        <Link href="/contact"
          className="px-6 py-3 rounded-xl font-semibold text-sm hover:bg-yellow-500/10 transition-all"
          style={{ border: '1px solid rgba(217,119,6,0.4)', color: '#D97706' }}>
          Get in Touch
        </Link>
      </div>
    </div>
  )
}
