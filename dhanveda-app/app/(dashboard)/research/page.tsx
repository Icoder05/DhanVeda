'use client'
import { useState, useRef } from 'react'
import TradingViewChart from '@/components/TradingViewChart'

const RMETA: Record<string, { n: string; h: string }> = {
  pe: { n: 'P/E Ratio', h: "Years of profit you're paying for. P/E 20 = ₹20 per ₹1 earned." },
  pb: { n: 'P/B Ratio', h: 'Price vs actual assets. Below 1 = possible undervaluation.' },
  ev_ebitda: { n: 'EV/EBITDA', h: 'Like P/E but includes debt. Below 10 = reasonable.' },
  roe: { n: 'ROE %', h: 'Return on shareholders money. Above 15% is healthy.' },
  roce: { n: 'ROCE %', h: 'Return on all capital. Above 15% = positive.' },
  npm: { n: 'Net Profit Margin', h: 'Profit per ₹100 sales. Shrinking = red flag.' },
  opm: { n: 'Operating Margin', h: 'Core business efficiency. Expanding = more efficient.' },
  debt_equity: { n: 'Debt/Equity', h: 'Borrowing vs ownership. Above 2 can be risky.' },
  current_ratio: { n: 'Current Ratio', h: 'Can pay short-term bills? Above 1.5 = healthy.' },
  interest_cov: { n: 'Interest Coverage', h: 'Profits vs loan interest. Below 2 = risky.' },
  revenue_growth: { n: 'Revenue Growth', h: 'Sales growth YoY. 15%+ = healthy.' },
  eps_growth: { n: 'EPS Growth', h: 'Profit per share growing? 15-20% = compounder.' },
  promoter_pledge: { n: 'Promoter Pledge %', h: 'Shares pledged as collateral. Above 20% = red flag.' },
  dividend_yield: { n: 'Dividend Yield', h: 'Annual dividend as % of price.' },
}

interface AnalysisResult {
  name?: string; ticker?: string; sector?: string; score?: number; score_reasoning?: string;
  esg_overall?: string; esg_env?: number; esg_soc?: number; esg_gov?: number; esg_note?: string;
  carbon_exposure?: string; bull_case?: string[]; bear_case?: string[];
  ratios?: Record<string, string>; ratio_context?: Record<string, string>;
  quarterly_results?: string; management_commentary?: string[];
  shareholding?: string; red_flags?: string[]; technical_summary?: string; verdict?: string;
}

function safe(v: unknown) {
  const s = String(v ?? '')
  return s && s !== 'null' && s !== 'N/A' ? s : 'N/A'
}

function safeArr<T>(v: unknown): T[] | null {
  return Array.isArray(v) && (v as T[]).length > 0 ? (v as T[]) : null
}

export default function ResearchPage() {
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const cacheRef = useRef<Record<string, AnalysisResult>>({})

  const CACHE_KEY = () => `${stock.toLowerCase().trim()}_${new Date().toDateString()}_h${Math.floor(new Date().getHours() / 12)}`

  async function analyse() {
    const s = stock.trim().replace(/[<>"'`{}\\]/g, '').substring(0, 50)
    if (!s) return
    setStock(s)
    setError('')
    setCached(false)

    const ckey = CACHE_KEY()
    if (cacheRef.current[ckey]) {
      setResult(cacheRef.current[ckey])
      setCached(true)
      return
    }

    setLoading(true)
    setResult(null)

    const prompt = `You are a strict senior equity research analyst at a top Indian institutional fund (DSP, Kotak AMC, HDFC AMC standard). ALL scoring is benchmarked ONLY against Indian market norms — never US, EU, or global peers.\n\nINDIAN MARKET REFERENCE BENCHMARKS (anchor every judgment here):\n- Nifty 50 trailing P/E: 22-24x; Nifty 500 median P/E: ~28x\n- Nifty 50 average ROE: 14-16%; top-quartile threshold: ≥20%\n- Nifty 50 average ROCE: 15-18%; WACC hurdle for Indian listed cos: 12-14%\n- India nominal GDP growth: 10-12% p.a. (minimum bar — any stock growing below this is a laggard)\n- India 10-yr G-Sec yield: ~7.0-7.2% (risk-free rate; use as interest coverage anchor)\n- NSE SECTOR P/E MEDIANS: IT Services 25-30x | FMCG/Consumer 45-55x | Private Banks 18-25x (P/B 2-4x) | PSU Banks 8-12x | Pharma 28-35x | Auto & Auto-Ancillary 18-25x | Oil & Gas/Energy 10-15x | Capital Goods/Defence 40-65x | Metals & Mining 8-12x | Realty 25-40x | Telecom 30-50x | Chemicals 25-35x | Cement 20-30x\n- SEBI mandates BRSR filing for top 1000 listed companies; promoter pledging >20% triggers SEBI watch\n\nSCORE ANCHOR: A score of 50 = median NSE-500 listed company. A Nifty-50 quality compounder (TCS, HDFC Bank, Asian Paints in its prime) scores 73-82. A high-growth mid-cap with some leverage scores 58-68. A loss-making or governance-impaired company scores below 35. Do NOT inflate.\n\nANALYSE: "${s}"\n\n━━ STEP 1 — LIVE DATA COLLECTION ━━\nSearch the web RIGHT NOW. Collect today's actual figures:\nFUNDAMENTALS: Trailing P/E (TTM), P/B, EV/EBITDA, ROE % (latest annual), ROCE %, Net Profit Margin %, Operating Margin % and whether it expanded or contracted YoY (in bps), Debt/Equity, Current Ratio, Interest Coverage ratio, Revenue growth YoY % (use 3-yr CAGR if available), EPS growth YoY %, FCF status (positive/negative/growing), Promoter holding %, Promoter pledge % of their total holding, Dividend yield %, latest quarter revenue (₹ cr) + PAT + OPM vs prior quarter and same quarter last year.\nTECHNICAL: Current price, 52W high, 52W low, 200DMA, 50DMA, approximate RSI-14, MACD signal (bullish/bearish crossover), recent volume vs 30-day average.\nGOVERNANCE: Any SEBI show-cause notice, NCLT filing, auditor resignation or qualification, large related-party transactions, BRSR filing status.\nList every figure found with source date. Mark unavailable as "N/A".\n\n━━ STEP 2 — INDIA-CALIBRATED SCORE (build from 0; apply mandatory deductions last) ━━\n\n【A】 PROFITABILITY /20 — benchmarked vs Nifty 50 averages\nROE sub-score /7:\n  +7 ROE ≥ 20% (top-quartile Indian company, well above Nifty avg 14-16%)\n  +5 ROE 15-19% (at or above Nifty average — solid)\n  +3 ROE 10-14% (below Nifty avg; acceptable for capital-intensive sectors)\n  +1 ROE 5-9% (weak for a listed company)\n   0 ROE < 5%, negative, or PAT loss\nROCE sub-score /7 (compare vs WACC hurdle of 12-14%):\n  +7 ROCE ≥ 20% (generating real returns well above cost of capital)\n  +5 ROCE 15-19%\n  +3 ROCE 12-14% (just covering WACC — neutral)\n  +1 ROCE 8-11% (destroying marginal value)\n   0 ROCE < 8%\nNet Margin sub-score /6 (Nifty 50 aggregate net margin ~12-14%):\n  +6 Net Margin > 18% (exceptional — IT/FMCG quality)\n  +4 Net Margin 10-18% (in line with Nifty 50 aggregate)\n  +2 Net Margin 4-9% (thin; typical for trading, distribution, commodity)\n   0 Net Margin < 4%\n  DEDUCT -2 if OPM contracted > 150 bps YoY (margin erosion signal)\n\n【B】 VALUATION /20 — compare ONLY vs relevant NSE sector median P/E above\nP/E vs sector median /8:\n  +8 P/E > 25% below sector median (materially cheap for the sector)\n  +5 P/E within ±15% of sector median (fairly valued)\n   0 P/E 15-35% above sector median (premium; needs growth justification)\n  -4 P/E 35-60% above sector median with EPS growth < 20% (unjustified premium)\n  -6 P/E > 2× sector median (speculative valuation; not grounded in earnings)\n  NOTE: For banks/NBFCs use P/B vs sector median instead of P/E.\nP/B vs ROE quality /6:\n  +6 P/B ≤ 2× with ROE ≥ 18% (undervalued quality — rare in Indian market)\n  +4 P/B 2-4× with ROE ≥ 15% (reasonable; in line with quality Indian franchises)\n  +1 P/B 2-4× with ROE 10-14% (average; modest quality at fair price)\n   0 P/B > 4× with ROE < 15% (value-trap risk)\n  -3 P/B > 6× with ROE < 12% (pure speculative premium)\nEV/EBITDA /6 (Indian quality names typically trade 15-30×):\n  +6 EV/EBITDA < 10× (cheap even by Indian standards)\n  +3 EV/EBITDA 10-18× (fair for Indian market)\n   0 EV/EBITDA 18-28× (stretched; only justified for >20% growth compounders)\n  -4 EV/EBITDA > 28× (expensive even vs Indian growth stocks)\n\n【C】 FINANCIAL HEALTH /20 — calibrated for Indian corporate debt norms\nDebt/Equity /8 (Indian cos historically carry more leverage than Western peers):\n  +8 D/E < 0.25 (conservatively financed; strong signal in capex-heavy India)\n  +5 D/E 0.25-0.75 (healthy across most Indian sectors)\n  +2 D/E 0.75-1.5 (moderate; stress-test with interest coverage)\n  -4 D/E 1.5-3.0 (high; flag in any non-infra, non-NBFC context)\n  -8 D/E > 3.0 (distressed territory; common pre-cursor to defaults)\n  EXCEPTION: Banks/NBFCs skip D/E — use Tier-1 CAR: ≥15% = +8, 12-15% = +4, <12% = -4.\nInterest Coverage /7 (anchor: India 10-yr G-Sec ~7%; safe floor is 4× not 8×):\n  +7 Coverage > 8× (very comfortable; can absorb rate hikes)\n  +5 Coverage 4-8× (safe by Indian standards; most Nifty companies here)\n  +2 Coverage 2-4× (marginal; watch for any debt rollover risk)\n  -5 Coverage 1-2× (debt service stress; one bad quarter is dangerous)\n  -8 Coverage < 1× (technical default risk; likely to dilute equity)\nCurrent Ratio /5 (Indian working capital norms; manufacturing typically 1.2-1.8×):\n  +5 Current Ratio > 2.0× (comfortable liquidity buffer)\n  +3 Current Ratio 1.5-2.0×\n  +1 Current Ratio 1.0-1.5× (tight but manageable)\n  -4 Current Ratio < 1.0× (liquidity crunch)\n\n【D】 GROWTH QUALITY /20 — benchmarked vs India nominal GDP 10-12%\nRevenue Growth /8 (use 3-yr CAGR if available; else TTM YoY):\n  +8 Revenue growth > 20% (compounding well above economy — strong)\n  +5 Revenue growth 12-20% (ahead of or at India nominal GDP — decent)\n  +2 Revenue growth 8-11% (pacing the economy — uninspiring)\n   0 Revenue growth 4-7% (lagging the economy — structural concern)\n  -3 Revenue declining (severe red flag in a 10-12% nominal growth economy)\nEPS Growth /7:\n  +7 EPS growth > 20% consistently (operating leverage + volume growth)\n  +5 EPS growth 12-20%\n  +2 EPS growth 8-11%\n   0 EPS growth < 8% or flat\n  -4 EPS declining despite revenue growth (margin compression, dilution, or tax anomaly)\nFree Cash Flow /5:\n  +5 FCF positive and growing YoY (high-quality earnings; not just accounting profit)\n  +2 FCF positive but flat or lumpy (capex cycle)\n  -3 FCF negative for 2+ consecutive years (cash-burning; question the business model)\n\n【E】 TECHNICAL + GOVERNANCE /20 — NSE/BSE context\nPrice vs moving averages /8:\n  +5 Price > 200DMA (institutional uptrend confirmed on NSE)\n  -5 Price < 200DMA (institutional distribution; avoid catching falling knife)\n  +3 50DMA > 200DMA (golden cross: momentum confirmed)\n  -3 50DMA < 200DMA (death cross: momentum broken)\nRSI-14 /3:\n  +3 RSI 40-65 (healthy momentum; not extended)\n  -3 RSI > 75 (overbought; high NSE circuit-filter risk on correction)\n  -2 RSI < 30 (distressed selling; only positive if fundamentals clearly support)\nPrice vs 52W range /3:\n  +3 Within 8% of 52W high with above-average volume (institutional accumulation)\n  -2 Within 8% of 52W low on above-average volume (distribution)\nPromoter pledging /4 (SEBI's most-watched governance metric for Indian investors):\n  +4 Pledge = 0% with promoter holding ≥ 40% (fully aligned, no collateral pressure)\n  +2 Pledge < 5%\n  -3 Pledge 10-25% (moderate forced-sale risk; monitor quarterly)\n  -6 Pledge 25-50% (high risk; historically source of price crashes — DHFL, Zee, ADAG)\n  -8 Pledge > 50% (extreme distress; forced selling likely)\nSEBI & ESG governance /2:\n  +2 BRSR filed + credible ESG disclosures + no SEBI adverse action\n  -3 Any pending SEBI show-cause notice or enforcement action\n\nMANDATORY DEDUCTIONS (apply to sum after all category scores; these override positives):\n  -12 Active SEBI enforcement, NCLT insolvency, or ED/CBI investigation\n  -10 Auditor resignation, forensic audit flag, or qualified audit opinion in last 24 months\n  -8 Receivables growing > 2× faster than revenue for 3+ quarters (revenue quality red flag)\n  -7 Three consecutive quarters of simultaneous revenue AND margin decline\n  -6 Promoter pledge > 35% of their total holding\n  -5 Interest coverage < 1.5× (imminent debt stress given Indian credit market rates)\n  -4 Promoter salary or related-party payments > 15% of net profit (wealth extraction)\n\nFINAL SCORE BANDS (reference to calibrate verdict):\n  83-95 → Exceptional (rare; Nifty-50 compounder grade)\n  73-82 → Good (sector leader; invest-worthy with known risks)\n  61-72 → Moderate (decent; selective buy on dips)\n  46-60 → Neutral (average NSE-500 company; hold or watch)\n  31-45 → Weak (structural issues; below India GDP growth)\n   5-30 → Avoid (loss-making, governance risk, or high debt)\nFloor: 5. Cap: 95.\n\n━━ STEP 3 — MANDATORY CROSS-CHECKS ━━\n1. Is every ratio_context ("good/neutral/bad") benchmarked vs Indian norms — NOT US/EU norms?\n2. Is the sector P/E median correctly matched (e.g., don't apply FMCG 50× to a metal stock)?\n3. Does the final score match the band description above?\n4. Score < 46 → verdict cannot include Buy. Score ≥ 73 → verdict cannot be Avoid. Fix any mismatch.\n5. Are quarterly figures in ₹ crore with actual numbers — not placeholder text?\n\n━━ STEP 4 — OUTPUT ━━\nOutput ONLY valid JSON. No markdown fence, no text before or after the JSON:\n{"name":"Full legal company name","ticker":"NSE ticker symbol only, no exchange suffix","sector":"exact NSE sector name","score":INTEGER_ONLY,"score_reasoning":"State the 2 category sub-scores that added the most points (with actual figures and Indian benchmark used) and the 2 that deducted the most (with actual figures). Example: ROE of 23% (+7, above Nifty avg 15%); P/E of 18x is 35% below sector median of 28x (+8); D/E of 2.1 (-4, above safe threshold); promoter pledge 28% (-6).","esg_overall":"Leader|Performer|Average|Laggard","esg_env":INTEGER,"esg_soc":INTEGER,"esg_gov":INTEGER,"esg_note":"1 factual sentence on BRSR status or ESG disclosure","carbon_exposure":"Low|Medium|High","bull_case":["India-specific data-backed reason with actual number","reason 2","reason 3"],"bear_case":["India-specific risk with actual number","risk 2","risk 3"],"ratios":{"pe":"actual trailing P/E or N/A","pb":"","ev_ebitda":"","roe":"","roce":"","npm":"","opm":"","debt_equity":"","current_ratio":"","interest_cov":"","revenue_growth":"","eps_growth":"","promoter_pledge":"","dividend_yield":""},"ratio_context":{"pe":"good|neutral|bad","pb":"good|neutral|bad","ev_ebitda":"good|neutral|bad","roe":"good|neutral|bad","roce":"good|neutral|bad","npm":"good|neutral|bad","opm":"good|neutral|bad","debt_equity":"good|neutral|bad","current_ratio":"good|neutral|bad","interest_cov":"good|neutral|bad","revenue_growth":"good|neutral|bad","eps_growth":"good|neutral|bad","promoter_pledge":"good|neutral|bad","dividend_yield":"good|neutral|bad"},"quarterly_results":"Most recent quarter: revenue ₹X cr, PAT ₹X cr, OPM X% — vs prior quarter (QoQ) and same quarter last year (YoY). Cite actual numbers.","management_commentary":["Exact quote or close paraphrase from latest earnings concall","Second key guidance or forward-looking comment"],"shareholding":"Promoter X%, FII X%, DII X% — from latest BSE/NSE filing. Estimate if live data unavailable.","red_flags":["Specific flag with data point. Write None if genuinely clean.","Second flag or omit"],"technical_summary":"Price ₹X vs 200DMA ₹X (X% above/below). RSI-14 at ~X. MACD is bullish/bearish crossover. Volume is above/below 30-day average. Trend is bullish/bearish/neutral.","verdict":"Exactly one of: Strong Buy / Buy / Hold / Avoid / Strong Avoid. Then: (High Confidence / Medium Confidence / Low Confidence). Then 2 sentences: the core thesis with specific numbers + the main India-market risk. Format — Buy (High Confidence) — Revenue CAGR of 18% over 3 years with zero promoter pledge and D/E of 0.3 make this a quality compounder; key risk is ..."}`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 2500, webSearch: true, feature: 'analysis', stock: s }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      cacheRef.current[ckey] = data
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (score: number) => score >= 73 ? '#10B981' : score >= 46 ? '#F59E0B' : '#DC2626'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">T &amp; F Analysis</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>14-KPI AI analysis with real-time web search · Results appear below</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <input
          value={stock}
          onChange={e => setStock(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && analyse()}
          placeholder="Enter stock name or NSE ticker (e.g. Reliance, INFY, HDFC Bank)"
          className="flex-1 px-4 py-3 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}
        />
        <button onClick={analyse} disabled={loading || !stock.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:brightness-110"
          style={{ background: '#059669' }}>
          {loading ? 'Analysing…' : 'Analyse →'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="dv-spinner" />
          <div className="text-sm text-white/40">Claude AI analysing <strong className="text-white/70">{stock}</strong>…</div>
          <div className="text-xs text-white/25">Searching Bloomberg, Moneycontrol, Reuters — 10–15 seconds</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl p-4 text-sm text-red-400" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <strong>Analysis failed — </strong>{error} — Try the same stock again.
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 anim-in">
          {cached && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
              ⚡ Cached · Same score guaranteed
            </div>
          )}

          {/* Section label */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>
              Technical &amp; Fundamental Analysis
            </div>
            <div className="flex-1 h-px" style={{ background: 'rgba(16,185,129,0.15)' }} />
            {result.ticker && (
              <a href={`/green/esg?ticker=${encodeURIComponent(result.ticker)}`}
                className="text-[11px] px-3 py-1 rounded-full font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(5,150,105,0.10)', color: '#10B981', border: '1px solid rgba(5,150,105,0.20)' }}>
                🌿 ESG Score →
              </a>
            )}
          </div>

          {/* Score header */}
          <div className="rounded-xl p-5 flex items-start justify-between gap-4"
            style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 2px 8px rgba(5,150,105,0.08)', borderTop: `4px solid ${scoreColor(result.score ?? 0)}` }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#064E3B' }}>{result.name ?? stock}</h2>
              <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                {result.ticker} · {result.sector}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                style={{ borderColor: scoreColor(result.score ?? 0), color: scoreColor(result.score ?? 0), background: `${scoreColor(result.score ?? 0)}12` }}>
                {result.score ?? '—'}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>DV Score</div>
            </div>
          </div>

          {/* Bull / Bear */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-3">Bull Case</div>
              <ul className="space-y-2">
                {(safeArr<string>(result.bull_case) ?? ['N/A']).map((b, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-emerald-500 flex-shrink-0">▲</span>{b}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Bear Case</div>
              <ul className="space-y-2">
                {(safeArr<string>(result.bear_case) ?? ['N/A']).map((b, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-red-400 flex-shrink-0">▼</span>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 14 KPI Table */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">14 Financial KPIs</div>
            <table className="ratio-table w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(5,150,105,0.15)' }}>
                  <th className="text-left text-xs text-white/30 pb-2 font-medium">Ratio</th>
                  <th className="text-right text-xs text-white/30 pb-2 font-medium">Value & Signal</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(RMETA).map(([key, meta]) => {
                  const val = safe(result.ratios?.[key])
                  const ctx = (result.ratio_context?.[key] ?? 'neutral').toLowerCase()
                  const isEst = val.startsWith('~')
                  const color = isEst ? '#F59E0B' : ctx === 'good' ? '#10B981' : ctx === 'bad' ? '#DC2626' : '#F59E0B'
                  const sig = isEst ? '~ Estimated' : ctx === 'good' ? '✓ Verified' : ctx === 'bad' ? '⚠ Weak' : '→ Moderate'
                  const sigColor = isEst ? '#94a3b8' : ctx === 'good' ? '#10B981' : ctx === 'bad' ? '#DC2626' : '#94a3b8'
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid rgba(5,150,105,0.15)' }}>
                      <td className="py-2.5 pr-4">
                        <div className="text-sm font-medium text-white/80">{meta.n}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{meta.h}</div>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="text-sm font-bold" style={{ color, opacity: isEst ? 0.7 : 1 }}>{val}</div>
                        <div className="text-[10px]" style={{ color: sigColor }}>{sig}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* TradingView Chart */}
          {result.ticker && result.ticker !== 'N/A' && (
            <TradingViewChart key={result.ticker} ticker={result.ticker} name={result.name ?? stock} />
          )}

          {/* Quarterly + Ownership + Red Flags */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 space-y-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Quarterly Results</div>
                <p className="text-sm text-white/60 leading-relaxed">{safe(result.quarterly_results)}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-yellow-500/70 mb-2">Management Commentary</div>
                <ul className="space-y-1">
                  {(safeArr<string>(result.management_commentary) ?? ['N/A']).map((m, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-yellow-500/50 flex-shrink-0">•</span>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-xl p-4 space-y-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Ownership</div>
                <p className="text-sm text-white/60 leading-relaxed">{safe(result.shareholding)}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-red-400/70 mb-2">Red Flags</div>
                <ul className="space-y-1">
                  {(safeArr<string>(result.red_flags) ?? ['No major red flags']).map((f, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-red-400/50 flex-shrink-0">⚠</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Technical */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400/60 mb-2">Technical Picture</div>
            <p className="text-sm text-white/60 leading-relaxed">{safe(result.technical_summary)}</p>
            <div className="mt-3 text-xs p-2.5 rounded-lg" style={{ background: 'rgba(30,111,168,0.08)', border: '1px solid rgba(30,111,168,0.15)', color: '#60a5fa' }}>
              📘 New to charts? Green candles = price rose. Red = fell. RSI below 30 = potential buy zone.
            </div>
          </div>

          {/* Verdict */}
          <div className="verdict-box">
            <div className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">ArthaSift Verdict · Score: {result.score}/100</div>
            {result.score_reasoning && <p className="text-xs text-white/30 mb-3">{result.score_reasoning}</p>}
            <p className="text-sm text-white/80 leading-relaxed">{safe(result.verdict)}</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center pt-2">
            <span className="text-xs text-white/30">Sources:</span>
            {['Bloomberg', 'Moneycontrol', 'Reuters', 'TradingView', 'NSE'].map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,0.05)', color: '#94a3b8' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

