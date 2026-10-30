import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse, stockMetrics } from '@/lib/schema'
import { inArray } from 'drizzle-orm'

/* ── Yahoo Finance v7 quote — supports up to 50 symbols in one request ──── */
const YF_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

interface BatchResult {
  [ticker: string]: {
    price: string | null; marketCapCr: string | null; pe: number | null
    pb: number | null; dividendYield: number | null
    week52High: string | null; week52Low: string | null
  }
}

async function yahooBatchQuote(tickers: string[]): Promise<BatchResult> {
  const result: BatchResult = {}

  // Try NSE (.NS) first for all tickers, then fall back to BSE (.BO) for failures
  for (const suffix of ['.NS', '.BO']) {
    const toTry = suffix === '.NS' ? tickers : tickers.filter(t => !result[t])
    if (toTry.length === 0) break

    try {
      const symbols = toTry.map(t => `${t}${suffix}`).join(',')
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,marketCap,trailingPE,priceToBook,dividendYield,fiftyTwoWeekHigh,fiftyTwoWeekLow`
      const res = await fetch(url, { headers: YF_HEADERS, cache: 'no-store' })
      if (!res.ok) continue

      const json = await res.json()
      const quotes: any[] = json?.quoteResponse?.result ?? []

      for (const q of quotes) {
        // Strip suffix to get the DhanVeda ticker
        const ticker = q.symbol?.replace('.NS', '').replace('.BO', '')
        if (!ticker || result[ticker]) continue
        if (!q.regularMarketPrice) continue  // Skip if Yahoo has no data

        const mcap = q.marketCap
        result[ticker] = {
          price:         q.regularMarketPrice?.toString() ?? null,
          marketCapCr:   mcap ? Math.round(mcap / 1e7).toString() : null,
          pe:            typeof q.trailingPE === 'number' ? Math.round(q.trailingPE * 10) / 10 : null,
          pb:            typeof q.priceToBook === 'number' ? Math.round(q.priceToBook * 10) / 10 : null,
          dividendYield: typeof q.dividendYield === 'number' ? Math.round(q.dividendYield * 1000) / 10 : null,
          week52High:    q.fiftyTwoWeekHigh?.toString() ?? null,
          week52Low:     q.fiftyTwoWeekLow?.toString() ?? null,
        }
      }
    } catch {
      continue
    }
  }

  return result
}

/* ══════════════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tickers } = await req.json()
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return NextResponse.json({ error: 'tickers array required' }, { status: 400 })
  }

  const clean = tickers
    .map((t: any) => String(t).trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50)  // max 50 per batch

  try {
    // Check which tickers already have fresh data (< 24h)
    const existing = await db
      .select({ ticker: stockMetrics.ticker, fetchedAt: stockMetrics.fetchedAt })
      .from(stockMetrics)
      .where(inArray(stockMetrics.ticker, clean))

    const staleSet = new Set<string>()
    const now = Date.now()
    const freshSet = new Set(
      existing
        .filter(r => r.fetchedAt && now - new Date(r.fetchedAt).getTime() < 24 * 3600 * 1000)
        .map(r => r.ticker)
    )
    for (const t of clean) {
      if (!freshSet.has(t)) staleSet.add(t)
    }

    if (staleSet.size === 0) {
      return NextResponse.json({ ok: true, fetched: 0, message: 'All stocks have fresh data' })
    }

    // Fetch from Yahoo Finance (all stale tickers in one request)
    const yf = await yahooBatchQuote([...staleSet])

    // Upsert into DB — only update the basic price/valuation fields
    const nowDate = new Date()
    const upserted: string[] = []

    await Promise.all(
      Object.entries(yf).map(async ([ticker, data]) => {
        if (!data.price) return  // Skip if no price data

        const row = {
          ticker,
          price:        data.price,
          marketCapCr:  data.marketCapCr,
          pe:           data.pe,
          pb:           data.pb,
          dividendYield: data.dividendYield,
          week52High:   data.week52High,
          week52Low:    data.week52Low,
          // These will be filled later by individual /fetch calls
          evEbitda:     null, roe: null, roce: null, npm: null, opm: null,
          debtEquity:   null, currentRatio: null, interestCov: null,
          revenueGrowth: null, epsGrowth: null,
          promoterHolding: null, promoterPledge: null,
          rawData:      { yahoo: data },
          fetchedAt:    nowDate,
          updatedAt:    nowDate,
        }

        // Ensure stock exists in universe
        await db.insert(stockUniverse)
          .values({ ticker, name: ticker, exchange: 'NSE' })
          .onConflictDoNothing()

        // Insert or update only basic fields (don't overwrite detailed metrics if they exist)
        await db.insert(stockMetrics)
          .values(row)
          .onConflictDoUpdate({
            target: stockMetrics.ticker,
            set: {
              price:        data.price,
              marketCapCr:  data.marketCapCr,
              pe:           data.pe,
              pb:           data.pb,
              dividendYield: data.dividendYield,
              week52High:   data.week52High,
              week52Low:    data.week52Low,
              fetchedAt:    nowDate,
              updatedAt:    nowDate,
            },
          })

        upserted.push(ticker)
      })
    )

    return NextResponse.json({
      ok: true,
      fetched: upserted.length,
      tickers: upserted,
      message: `Fetched ${upserted.length}/${staleSet.size} stocks from Yahoo Finance`,
    })
  } catch (err: any) {
    console.error('[screener/batch]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
