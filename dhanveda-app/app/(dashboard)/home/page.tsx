import Link from 'next/link'
import { auth } from '@/lib/auth'

export const metadata = { title: 'ArthaSift' }

const SECTIONS = [
  {
    label: 'Business & Venture',
    emoji: '🚀',
    color: '#8B5CF6',
    tools: [
      { icon: '🚀', label: 'New Business Score', href: '/venture/analyze', desc: 'GO / PIVOT / NO-GO verdict across 12 dimensions' },
      { icon: '🤝', label: 'Deal Analyzer', href: '/venture/deals', desc: 'Franchise, acquisition, JV & merger playbooks' },
      { icon: '🎯', label: 'Pitch Studio', href: '/venture/documents', desc: 'Business plan, canvas & pitch deck — PDF ready' },
    ],
  },
  {
    label: 'Research & Analysis',
    emoji: '📊',
    color: '#059669',
    tools: [
      { icon: '📊', label: 'T & F Analysis', href: '/research', desc: '14-KPI deep-dive on any NSE stock' },
      { icon: '📝', label: 'Transcript Analyser', href: '/research/transcript', desc: 'Earnings call tone, red flags & verdict' },
      { icon: '🌿', label: 'ESG Score', href: '/research/esg', desc: 'Environmental, social & governance ratings' },
    ],
  },
  {
    label: 'Decision Tools',
    emoji: '🧠',
    color: '#D97706',
    tools: [
      { icon: '🧠', label: 'Thesis Tester', href: '/decide', desc: 'Stress-test your investment bull case' },
      { icon: '⚠️', label: 'Bias Checker', href: '/decide/bias', desc: 'Identify FOMO, anchoring & other biases' },
      { icon: '📓', label: 'Conviction Journal', href: '/decide/journal', desc: 'Log decisions with AI coaching feedback' },
    ],
  },
  {
    label: 'Green Finance',
    emoji: '🌱',
    color: '#10B981',
    tools: [
      { icon: '☀️', label: 'Solar Calculator', href: '/green/solar', desc: '25-yr NPV, IRR & PM Surya Ghar subsidy' },
      { icon: '🌿', label: 'Carbon & RECs', href: '/green/carbon', desc: 'IEX REC market & India Carbon Market guide' },
      { icon: '🏢', label: 'REIT Intelligence', href: '/green/reit', desc: 'All 5 Indian REITs — yield, WALE, occupancy' },
      { icon: '🌱', label: 'ESG Screener', href: '/green/screener', desc: '430+ NSE stocks filtered by ESG priority' },
    ],
  },
  {
    label: 'My Money',
    emoji: '💼',
    color: '#1E6FA8',
    tools: [
      { icon: '💼', label: 'Portfolio', href: '/money', desc: 'Health score, rebalancing & SIP suggestions' },
      { icon: '💬', label: 'Community & Network', href: '/money/community', desc: 'Investor & founder community + AI advisor' },
      { icon: '📚', label: 'Learn', href: '/money/learn', desc: 'Lessons, quizzes & business frameworks' },
    ],
  },
]

export default async function HomeDashboard() {
  const session = await auth()
  const name = session?.user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="dv-main p-6 md:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#064E3B' }}>Welcome back, {name}</h1>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>India's AI platform for investors & entrepreneurs — pick a tool to get started</p>
      </div>

      {/* Tool sections */}
      <div className="space-y-8">
        {SECTIONS.map(s => (
          <div key={s.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{s.emoji}</span>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: s.color }}>
                {s.label}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {s.tools.map(t => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="flex gap-3 items-start rounded-xl p-4 group transition-all hover:shadow-md"
                  style={{ background: '#ffffff', border: `1px solid ${s.color}18`, textDecoration: 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}
                  >
                    {t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm mb-0.5 group-hover:underline" style={{ color: '#064E3B' }}>
                      {t.label}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{t.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
