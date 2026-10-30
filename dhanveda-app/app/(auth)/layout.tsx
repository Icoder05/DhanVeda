import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse at 25% 15%, rgba(16,185,129,0.07) 0%, transparent 55%), linear-gradient(160deg, #07090f 0%, #0d1117 60%, #111827 100%)',
      }}>
      <Link href="/" className="flex items-center gap-2 justify-center mb-10 hover:opacity-80 transition-opacity">
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:4, borderRadius:12, border:'1px solid rgba(16,185,129,0.3)', boxShadow:'0 0 16px rgba(16,185,129,0.2), inset 0 0 8px rgba(16,185,129,0.06)', flexShrink:0 }}>
          <img src="/artha-logo.png" alt="" style={{ height: 36, width: 'auto', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
        </div>
        <span className="font-serif text-3xl text-white tracking-tight leading-none">
          Artha<span className="text-yellow-400">Sift</span>
        </span>
      </Link>
      {children}
    </div>
  )
}
