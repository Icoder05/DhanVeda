import Link from 'next/link'

const tools = [
  { href: '/green/solar', icon: '☀️', title: 'Solar ROI Calculator', desc: '25-year NPV, IRR, payback with PM Surya Ghar subsidy and REC income.' },
  { href: '/green/carbon', icon: '🌿', title: 'Carbon & RECs Guide', desc: 'BEE PAT, IEX REC market, India Carbon Market — step by step.' },
  { href: '/green/reit', icon: '🏢', title: 'REIT Intelligence', desc: 'All 5 Indian REITs analysed — yield, occupancy, WALE, ESG.' },
  { href: '/green/screener', icon: '📊', title: 'ESG Stock Screener', desc: 'Screen NSE stocks by sector and ESG priority.' },
]

const links = [
  { label: 'REC Registry (RECPDCL)', url: 'https://recpdcl.in', tag: 'REC' },
  { label: 'PM Surya Ghar Portal', url: 'https://pmsuryaghar.gov.in', tag: 'Solar' },
  { label: 'BEE India', url: 'https://beeindia.gov.in', tag: 'PAT' },
  { label: 'IEX — Power Exchange', url: 'https://www.iexindia.com', tag: 'REC/Carbon' },
  { label: 'CERC — Carbon Market', url: 'https://cercind.gov.in', tag: 'CCTS' },
  { label: 'SEBI ESG Disclosures', url: 'https://www.sebi.gov.in', tag: 'BRSR' },
]

export default function GreenHubPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white mb-1">Green Finance Hub</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>India-specific green finance intelligence — solar, RECs, carbon credits, REITs</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {tools.map(t => (
          <Link key={t.href} href={t.href}
            className="rounded-xl p-5 flex gap-4 hover:border-emerald-600 transition-all"
            style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-3xl flex-shrink-0">{t.icon}</div>
            <div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#064E3B' }}>{t.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#059669' }}>Official Green Finance Resources — India</div>
        <div className="space-y-2">
          {links.map((l, i) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener"
              className="flex items-center justify-between py-3 hover:opacity-75 transition-opacity"
              style={{ borderBottom: i < links.length - 1 ? '1px solid rgba(5,150,105,0.1)' : 'none' }}>
              <span className="text-sm" style={{ color: '#374151' }}>{l.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                  {l.tag}
                </span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}


