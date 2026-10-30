import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="text-white/50 text-sm" style={{ background: '#040F08', borderTop: '1px solid rgba(16,185,129,0.07)' }}>
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:2, borderRadius:7, border:'1px solid rgba(16,185,129,0.22)', boxShadow:'0 0 8px rgba(16,185,129,0.14)', flexShrink:0 }}>
              <img src="/artha-logo.png" alt="" style={{ height: 22, width: 'auto', objectFit: 'contain', borderRadius: 5, display: 'block' }} />
            </div>
            <span className="font-serif text-base text-white leading-none">Artha<span className="text-yellow-500">Sift</span></span>
          </div>
          <p className="text-[9px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '.08em' }}>
            CHANNELISING INVESTMENTS, STREAMLINING SERVICES.
          </p>
          <p className="text-xs leading-relaxed text-white/40">
            India&apos;s AI platform for investors &amp; entrepreneurs. Research smarter, build better, grow wealthier.
          </p>
        </div>
        <div>
          <div className="text-white/70 font-semibold mb-3 text-xs uppercase tracking-wider">Platform</div>
          {[
            ['Business & Venture', '/login?next=/venture/analyze'],
            ['Research', '/login?next=/research'],
            ['Green Finance', '/login?next=/green'],
            ['My Money', '/login?next=/money'],
            ['Learn', '/login?next=/money/learn'],
          ].map(([label, href]) => (
            <Link key={label} href={href} className="block py-1 text-xs hover:text-yellow-400 transition-colors">{label}</Link>
          ))}
        </div>
        <div>
          <div className="text-white/70 font-semibold mb-3 text-xs uppercase tracking-wider">Company</div>
          {[['About', '/about'], ['Services', '/services'], ['Pricing', '/pricing'], ['Contact', '/contact']].map(([label, href]) => (
            <Link key={href} href={href} className="block py-1 text-xs hover:text-yellow-400 transition-colors">{label}</Link>
          ))}
        </div>
        <div>
          <div className="text-white/70 font-semibold mb-3 text-xs uppercase tracking-wider">Legal</div>
          <Link href="/terms" className="block py-1 text-xs hover:text-yellow-400 transition-colors">Terms &amp; Conditions</Link>
          <p className="text-xs text-white/30 leading-relaxed mt-2">
            For educational purposes only. Not SEBI registered investment advice.
          </p>
        </div>
      </div>
      <div className="text-center text-xs text-white/20 py-4 border-t border-white/5">
        © {new Date().getFullYear()} ArthaSift. Built in India. v1.0
      </div>
    </footer>
  )
}
