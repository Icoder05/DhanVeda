import Link from 'next/link'

const free = [
  'Business Idea Scorer — GO / PIVOT / NO-GO verdict',
  'Deal Analyzer — franchise, JV & acquisition playbooks',
  'Pitch Studio — business plan, canvas & pitch deck',
  'Investor & Founder Network + AI Advisor',
  '14-KPI stock analysis (unlimited)',
  'ESG scores for any stock',
  'Earnings transcript analyser',
  'Thesis stress-tester',
  'Bias checker',
  'Conviction journal',
  'Solar ROI calculator',
  'REIT intelligence',
  'Carbon & RECs guide',
  'ESG stock screener',
  'Portfolio health analysis',
  'Community feed & AI synthesis',
  'AI investing & business framework lessons',
]

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide"
          style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#059669' }}>
          Early Access Pricing
        </div>
        <h1 className="font-serif text-4xl mb-3" style={{ color: '#064E3B' }}>Simple, honest pricing</h1>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          Everything is free during early access. Paid plans arrive in 2026 — early users get grandfathered rates.
        </p>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl p-8 bg-white shadow-lg border-2 border-emerald-500">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Early Access</div>
          <div className="font-serif text-5xl font-medium mb-1" style={{ color: '#064E3B' }}>₹0</div>
          <div className="text-sm text-gray-400 mb-6">per month · forever (while in early access)</div>

          <ul className="space-y-3 mb-8">
            {free.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link href="/signup"
            className="block text-center py-3 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all"
            style={{ background: '#059669' }}>
            Get Free Access →
          </Link>
        </div>

        <div className="mt-6 rounded-xl p-5 border border-yellow-200 bg-yellow-50">
          <div className="text-xs font-semibold text-yellow-700 mb-1">Coming 2026 — Pro Plan</div>
          <p className="text-xs text-yellow-600">
            Portfolio tracking across brokers, advanced screener, priority AI, team plans. Early users get 40% off forever.
          </p>
        </div>
      </div>
    </div>
  )
}
