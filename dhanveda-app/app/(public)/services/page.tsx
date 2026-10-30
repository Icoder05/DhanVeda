import Link from 'next/link'

const services = [
  {
    category: '🚀 Business & Venture Intelligence',
    color: '#8B5CF6',
    badge: 'VentureIQ',
    items: [
      { title: 'Business Idea Scorer', desc: 'Score any business idea across 12 dimensions using Y Combinator & Sequoia criteria, Peter Thiel\'s Zero-to-One monopoly framework, unit economics, and Blue Ocean Strategy. Get a deterministic GO / PIVOT / NO-GO verdict.' },
      { title: 'Deal Analyzer', desc: 'Evaluate franchises, acquisitions, joint ventures, mergers, and manufacturing licenses. AI generates your negotiation playbook, due diligence checklist, and valuation model — QC-verified by a second agent.' },
      { title: 'Pitch Studio', desc: 'AI-generates a complete Business Plan, Business Model Canvas, and Pitch Deck with financial charts. Multi-agent QC pipeline ensures specificity and accuracy. PDF-ready and investor-impressive.' },
      { title: 'Investor & Founder Network', desc: 'Share your venture score with peers, learn from other founders, and ask our AI Advisor anything about strategy, funding rounds, deal structures, or business scaling.' },
    ],
  },
  {
    category: '📊 Research Intelligence',
    color: '#059669',
    items: [
      { title: 'Stock Search & 14-KPI Analysis', desc: 'Real-time web search + Claude AI delivers P/E, P/B, ROE, ROCE, margins, debt ratios, growth, promoter pledging, and a final verdict with score.' },
      { title: 'Earnings Transcript Analyser', desc: 'Paste any earnings call transcript — get tone analysis, green/red flags, management confidence score, hidden concerns, and a two-sentence verdict.' },
      { title: 'ESG Score Checker', desc: 'Environmental (BRSR, carbon, net zero), Social (workforce, safety), and Governance (pledging, disclosure) scores for any NSE-listed company.' },
    ],
  },
  {
    category: '🧠 Decision Tools',
    color: '#D97706',
    items: [
      { title: 'Thesis Stress-Tester', desc: 'Write your investment bull case — AI finds holes, blind spots, bear counterarguments, and key monitoring metrics.' },
      { title: 'Investment Bias Checker', desc: 'Describe your reasoning + emotional state — AI scores FOMO level, logic quality, and identifies specific cognitive biases at play.' },
      { title: 'Conviction Journal', desc: 'Log every buy/sell/hold decision with reasoning. AI coach gives instant feedback on quality of thinking and patterns over time.' },
    ],
  },
  {
    category: '🌱 Green Finance',
    color: '#10B981',
    items: [
      { title: 'Solar ROI Calculator', desc: '25-year NPV, IRR, payback period with state-specific subsidies, PM Surya Ghar eligibility, and REC income projections.' },
      { title: 'Carbon & RECs Guide', desc: 'Step-by-step guide to BEE PAT, IEX REC market, India Carbon Market (ICM), and CERC Carbon Credit Certificates (CCC).' },
      { title: 'REIT Intelligence', desc: 'All 5 Indian REITs: Embassy, Mindspace, Brookfield, Nexus, Knowledge Realty — yield assessment, NAV, occupancy, WALE, ESG.' },
      { title: 'ESG Stock Screener', desc: 'Filter NSE stocks by sector and ESG priority (E, S, or G) — get top performers and stocks to avoid with real data.' },
    ],
  },
  {
    category: '💼 My Money',
    color: '#1E6FA8',
    items: [
      { title: 'Portfolio Intelligence', desc: 'Enter your holdings — get health score, quality score, concentration risk, rebalancing advice, and SIP suggestions.' },
      { title: 'Community Intelligence', desc: 'Post anonymous bull/bear views on stocks. AI synthesises sentiment, detects FOMO in the crowd, and gives a contrarian view.' },
      { title: 'Learn Investing', desc: 'AI-generated lessons on P/E, ROE, ROCE, ESG, REITs, RECs, business frameworks — with quizzes for Indian investors and entrepreneurs.' },
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h1 className="font-serif text-4xl mb-3" style={{ color: '#064E3B' }}>For investors and entrepreneurs alike</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">Five intelligence modules. Eighteen AI features. One platform.</p>
      </div>

      {services.map(s => (
        <div key={s.category} className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-semibold text-lg" style={{ color: s.color }}>{s.category}</h2>
            {'badge' in s && s.badge && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}>
                {s.badge}
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {s.items.map(item => (
              <div key={item.title} className="rounded-xl p-5 bg-white shadow-sm"
                style={{ border: `1px solid ${'badge' in s && s.badge ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                <h3 className="font-semibold mb-2 text-sm" style={{ color: '#064E3B' }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center">
        <Link href="/signup"
          className="inline-block px-8 py-4 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all"
          style={{ background: '#059669' }}>
          Get Free Access →
        </Link>
      </div>
    </div>
  )
}
