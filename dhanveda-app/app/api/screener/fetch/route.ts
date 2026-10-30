import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse, stockMetrics } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { callClaude } from '@/lib/claude'

/* ── Yahoo Finance quoteSummary ─────────────────────────────────────────── */
const YF_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

interface YFMetrics {
  price: string | null; marketCapCr: string | null
  pe: number | null; pb: number | null; evEbitda: number | null
  roe: number | null; npm: number | null; opm: number | null
  debtEquity: number | null; currentRatio: number | null
  revenueGrowth: number | null; epsGrowth: number | null
  dividendYield: number | null; week52High: string | null; week52Low: string | null
}

async function fetchFromYahoo(ticker: string): Promise<YFMetrics | null> {
  const suffixes = ['.NS', '.BO']
  for (const suffix of suffixes) {
    try {
      const symbol = encodeURIComponent(`${ticker}${suffix}`)
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData%2CdefaultKeyStatistics%2CsummaryDetail`
      const res = await fetch(url, { headers: YF_HEADERS, cache: 'no-store' })
      if (!res.ok) continue

      const json = await res.json()
      const r = json?.quoteSummary?.result?.[0]
      if (!r) continue

      const fin  = r.financialData        ?? {}
      const stat = r.defaultKeyStatistics ?? {}
      const sum  = r.summaryDetail        ?? {}

      const num = (v: any, mult = 1): number | null => {
        const raw = v?.raw
        if (typeof raw !== 'number') return null
        return Math.round(raw * mult * 100) / 100
      }
      const str = (v: any): string | null => {
        const raw = v?.raw
        return typeof raw === 'number' ? raw.toString() : null
      }

      const de = fin.debtToEquity?.raw
      return {
        price:          str(sum.regularMarketPrice) ?? str(fin.currentPrice),
        marketCapCr:    sum.marketCap?.raw ? Math.round(sum.marketCap.raw / 1e7).toString() : null,
        pe:             num(sum.trailingPE),
        pb:             num(stat.priceToBook),
        evEbitda:       num(stat.enterpriseToEbitda),
        roe:            num(fin.returnOnEquity, 100),
        npm:            num(fin.profitMargins,  100),
        opm:            num(fin.operatingMargins, 100),
        debtEquity:     typeof de === 'number' ? Math.round(de) / 100 : null,
        currentRatio:   num(fin.currentRatio),
        revenueGrowth:  num(fin.revenueGrowth, 100),
        epsGrowth:      num(stat.earningsQuarterlyGrowth, 100),
        dividendYield:  num(sum.dividendYield, 100) ?? num(sum.trailingAnnualDividendYield, 100),
        week52High:     str(sum.fiftyTwoWeekHigh),
        week52Low:      str(sum.fiftyTwoWeekLow),
      }
    } catch {
      continue
    }
  }
  return null
}

/* ── AI fallback for India-specific fields not in Yahoo ─────────────────── */
interface AIExtras { roce: number | null; interestCov: number | null; promoterHolding: number | null; promoterPledge: number | null }

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.\-]/g, '')) : Number(v)
  return isNaN(n) ? null : n
}

async function fetchExtrasFromAI(ticker: string, name: string): Promise<AIExtras> {
  try {
    const prompt =
      `Search NSE/BSE for "${name}" (${ticker}) and return ONLY this JSON:\n` +
      `{"roce":null,"interest_cov":null,"promoter_holding":null,"promoter_pledge":null}\n` +
      `All numbers as plain floats (no % or x). null if unavailable. No markdown.`
    const raw = await callClaude({ prompt, maxTokens: 200, webSearch: true }) as any
    return {
      roce:            parseNum(raw?.roce),
      interestCov:     parseNum(raw?.interest_cov),
      promoterHolding: parseNum(raw?.promoter_holding),
      promoterPledge:  parseNum(raw?.promoter_pledge),
    }
  } catch {
    return { roce: null, interestCov: null, promoterHolding: null, promoterPledge: null }
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const ticker = body.ticker?.trim().toUpperCase()
  const force: boolean = body.force ?? false

  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    // Return cached data if fresh
    const existing = await db.select().from(stockMetrics).where(eq(stockMetrics.ticker, ticker)).limit(1)
    if (!force && existing[0]?.fetchedAt) {
      const ageMs = Date.now() - new Date(existing[0].fetchedAt).getTime()
      if (ageMs < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ ...existing[0], cached: true })
      }
    }

    const stockRow = await db.select().from(stockUniverse).where(eq(stockUniverse.ticker, ticker)).limit(1)
    const stockName = stockRow[0]?.name ?? ticker

    // Phase 1: Yahoo Finance (fast, structured, free)
    const yf = await fetchFromYahoo(ticker)

    // Phase 2: AI for India-specific data (promoter, ROCE, interest coverage)
    const extras = await fetchExtrasFromAI(ticker, stockName)

    if (!yf && !extras.roce) {
      return NextResponse.json({ error: 'No data available from any source' }, { status: 502 })
    }

    const now = new Date()
    const row = {
      ticker,
      price:           yf?.price           ?? null,
      marketCapCr:     yf?.marketCapCr      ?? null,
      pe:              yf?.pe               ?? null,
      pb:              yf?.pb               ?? null,
      evEbitda:        yf?.evEbitda         ?? null,
      roe:             yf?.roe              ?? null,
      roce:            extras.roce,
      npm:             yf?.npm              ?? null,
      opm:             yf?.opm              ?? null,
      debtEquity:      yf?.debtEquity       ?? null,
      currentRatio:    yf?.currentRatio     ?? null,
      interestCov:     extras.interestCov,
      revenueGrowth:   yf?.revenueGrowth    ?? null,
      epsGrowth:       yf?.epsGrowth        ?? null,
      promoterHolding: extras.promoterHolding,
      promoterPledge:  extras.promoterPledge,
      dividendYield:   yf?.dividendYield    ?? null,
      week52High:      yf?.week52High       ?? null,
      week52Low:       yf?.week52Low        ?? null,
      rawData:         { yahoo: yf, ai: extras },
      fetchedAt:       now,
      updatedAt:       now,
    }

    await db.insert(stockUniverse).values({ ticker, name: stockName, exchange: 'NSE' }).onConflictDoNothing()
    await db.insert(stockMetrics).values(row).onConflictDoUpdate({
      target: stockMetrics.ticker,
      set: { ...row, updatedAt: now },
    })

    return NextResponse.json({ ...row, cached: false })
  } catch (err: any) {
    console.error('[screener/fetch]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
