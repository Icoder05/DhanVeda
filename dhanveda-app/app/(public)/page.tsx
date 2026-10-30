import Link from 'next/link'
import HeroCanvas from '@/components/HeroCanvas'

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#030C07',
        }}
      >
        {/* Animated canvas */}
        <HeroCanvas />

        {/* Central ambient glow behind text */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(16,185,129,0.07) 0%, transparent 70%)',
        }} />

        {/* Edge vignette — darkens corners so canvas feels contained */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 38%, rgba(3,12,7,0.72) 100%)',
        }} />

        {/* Bottom gradient blends into the dark stats bar */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 220, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, #022C22 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '96px 24px 148px',
          maxWidth: 840,
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Live indicator badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.18)',
            color: '#34D399',
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: '#10B981',
              boxShadow: '0 0 8px 2px rgba(16,185,129,0.65)',
              display: 'inline-block',
            }} />
            India&apos;s AI Platform for Investors &amp; Entrepreneurs
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2.75rem, 6.5vw, 4.8rem)',
            fontWeight: 500,
            lineHeight: 1.1,
            color: '#ECFDF5',
            marginBottom: 22,
            letterSpacing: '-0.01em',
            textWrap: 'balance',
          } as React.CSSProperties}>
            Invest Smarter.<br />
            <span style={{ color: '#F59E0B' }}>Build Better.</span><br />
            Grow Wealthier.
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: 'rgba(236,253,245,0.48)',
            maxWidth: 545,
            margin: '0 auto 42px',
          }}>
            Stock research, ESG analysis, green finance, and VentureIQ — the AI engine
            that scores business ideas using YC, Thiel, and unit economics frameworks.
            Built for the modern Indian investor and entrepreneur.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 52,
          }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-block',
                background: '#059669',
                color: '#fff',
                padding: '14px 30px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 0 32px rgba(5,150,105,0.35), 0 4px 16px rgba(0,0,0,0.3)',
                letterSpacing: '0.01em',
              }}
            >
              Start Free — No Credit Card →
            </Link>
            <Link
              href="/services"
              style={{
                display: 'inline-block',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#F59E0B',
                padding: '14px 30px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                background: 'rgba(245,158,11,0.05)',
              }}
            >
              See All Features
            </Link>
          </div>

          {/* Stat pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 1,
            justifyContent: 'center',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(16,185,129,0.12)',
            maxWidth: 560,
            margin: '0 auto',
          }}>
            {[
              { n: '14',  label: 'Financial KPIs' },
              { n: '12',  label: 'Business Dimensions' },
              { n: 'ESG', label: 'On Every Stock' },
              { n: 'AI',  label: 'Multi-Agent Engine' },
            ].map((s, i, arr) => (
              <div key={s.n} style={{
                flex: '1 1 120px',
                background: 'rgba(16,185,129,0.04)',
                borderRight: i < arr.length - 1 ? '1px solid rgba(16,185,129,0.12)' : 'none',
                padding: '16px 12px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#34D399',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}>{s.n}</div>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(236,253,245,0.4)',
                  marginTop: 6,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ background: '#040F08', borderTop: '1px solid rgba(16,185,129,0.07)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl mb-3" style={{ color: '#ECFDF5' }}>How ArthaSift Works</h2>
          <p className="text-sm mb-10" style={{ color: 'rgba(236,253,245,0.4)' }}>Research-grade intelligence in three steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'For stock investors', desc: 'Research any NSE stock — 14 KPIs, ESG ratings, bias checks, and portfolio intelligence in one flow.' },
              { step: '2', title: 'For green finance',   desc: 'Solar ROI, REC market, REIT intelligence, carbon credits — green alpha for the conscious investor.' },
              { step: '3', title: 'For entrepreneurs',   desc: 'Score a business idea with VentureIQ. Get a GO/PIVOT/NO-GO verdict, pitch deck, and negotiation playbook.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}
                >
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2 text-sm" style={{ color: '#ECFDF5' }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(236,253,245,0.38)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
