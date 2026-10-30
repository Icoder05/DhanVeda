import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'ArthaSift — Channelising Investments, Streamlining Services.',
  description:
    "India's first AI-powered green equity intelligence platform. 14-KPI stock analysis, ESG scores, solar ROI calculator, REIT intelligence and behavioural coaching.",
  keywords: 'stock analysis, ESG investing, green finance, India stocks, AI investing',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased"><Providers>{children}</Providers></body>
    </html>
  )
}
