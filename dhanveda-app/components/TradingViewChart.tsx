'use client'
import { useEffect, useRef } from 'react'

interface Props {
  ticker: string  // raw NSE ticker e.g. "RELIANCE"
  name: string
}

// Strip exchange suffixes that some AI providers append (.NS, .BO)
function cleanTicker(raw: string): string {
  return raw.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE)$/i, '')
}

const CHART_HEIGHT = 550

export default function TradingViewChart({ ticker, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !ticker || ticker === 'N/A' || ticker.toUpperCase() === 'UNDEFINED') return

    const symbol = `NSE:${cleanTicker(ticker)}`

    // TradingView requires the parent to carry `tradingview-widget-container`
    // and the inner div to carry `tradingview-widget-container__widget`.
    // Without this class structure the widget can't locate its render target
    // and falls back to Apple Inc (AAPL) — the default cached symbol.
    el.innerHTML = ''
    el.className = 'tradingview-widget-container'
    el.style.cssText = `height:${CHART_HEIGHT}px;width:100%;`

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.cssText = 'height:100%;width:100%;'
    el.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'

    // Config must be set on the script element BEFORE appending to DOM.
    // TradingView reads textContent synchronously when the script tag is parsed.
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',        // Daily — 90-180 candles fills chart cleanly (Weekly had too few)
      range: '6M',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#022C22',
      gridColor: 'rgba(16,185,129,0.06)',
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      withdateranges: true,
      studies: [
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
      ],
      support_host: 'https://www.tradingview.com',
    })
    el.appendChild(script)

    return () => {
      if (el) {
        el.innerHTML = ''
        el.className = ''
        el.style.cssText = ''
      }
    }
  }, [ticker])

  const displayTicker = cleanTicker(ticker)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(217,119,6,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ background: '#022C22', borderBottom: '1px solid rgba(217,119,6,0.18)' }}
      >
        <div className="flex items-center gap-3">
          {/* Live pulse dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
              style={{ background: '#10B981' }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: '#10B981' }}
            />
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{name}</span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-md"
              style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              NSE:{displayTicker}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 text-[11px] font-medium"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <span>Daily · 6M · RSI · MACD</span>
          </div>
          <a
            href={`https://www.tradingview.com/chart/?symbol=NSE%3A${encodeURIComponent(displayTicker)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 flex-shrink-0"
            style={{
              background: 'rgba(217,119,6,0.15)',
              color: '#D97706',
              border: '1px solid rgba(217,119,6,0.3)',
            }}
          >
            Full Chart ↗
          </a>
        </div>
      </div>

      {/* ── TradingView widget mounts here ──
          The ref div becomes tradingview-widget-container (set in useEffect).
          A fixed pixel height is critical — autosize reads the container's
          computed height to fill it; minHeight alone is insufficient. ── */}
      <div ref={containerRef} style={{ height: CHART_HEIGHT, background: '#022C22' }} />

      {/* ── Footer ── */}
      <div
        className="px-5 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]"
        style={{
          background: '#022C22',
          borderTop: '1px solid rgba(16,185,129,0.1)',
          color: 'rgba(255,255,255,0.28)',
        }}
      >
        <span>NSE · Daily candles · IST</span>
        <span>·</span>
        <span style={{ color: '#10B981' }}>RSI &lt;30 = buy zone</span>
        <span>·</span>
        <span style={{ color: '#DC2626' }}>RSI &gt;70 = overbought</span>
        <span>·</span>
        <span>Powered by TradingView</span>
      </div>
    </div>
  )
}
