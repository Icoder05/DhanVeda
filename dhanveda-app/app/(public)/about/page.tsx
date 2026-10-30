import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide"
        style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#059669' }}>
        Our Story
      </div>
      <h1 className="font-serif text-4xl mb-5" style={{ color: '#064E3B' }}>
        Built by an investor, for investors
      </h1>
      <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed space-y-5 text-[15px]">
        <p>
          ArthaSift was born out of frustration. As a retail investor in India, I found that institutional-grade tools — 14-KPI analysis, ESG ratings, behavioural coaching — were locked behind expensive subscriptions or buried in complex platforms built for fund managers.
        </p>
        <p>
          I&apos;m <strong>Srikrishna</strong>, and I built ArthaSift from Mumbai with a simple belief: every Indian investor deserves the same quality of research that the best fund managers use, without the jargon or the cost.
        </p>
        <p>
          ArthaSift combines three things that no other Indian platform offers together:
        </p>
        <ul className="list-none space-y-3 pl-0">
          {[
            ['📊', 'Fundamental analysis at depth — 14 financial KPIs with context, not just numbers'],
            ['🌱', 'Green finance intelligence — India-specific: solar, RECs, carbon credits, all 5 REITs'],
            ['🧠', 'Behavioural coaching — catch your FOMO and biases before they cost you money'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p>
          We&apos;re AI-powered (using Anthropic&apos;s Claude with real-time web search), India-focused (NSE stocks, BRSR, PM Surya Ghar, BEE, CERC), and committed to keeping early access free while we build.
        </p>
        <p>
          Join thousands of investors who are researching smarter, investing wiser, and living greener.
        </p>
      </div>
      <div className="mt-10 flex gap-4">
        <Link href="/signup"
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 transition-all"
          style={{ background: '#059669' }}>
          Start Free
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
