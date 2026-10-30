import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { STOCK_UNIVERSE } from '@/lib/stockSeed'
import { stockUniverse } from '@/lib/schema'
import { computeESGFromData } from '@/lib/esgScoring'
import { getShareholding, NSE_TO_BSE } from '@/lib/bseApi'

/* Migrate: creates/alters tables and seeds the full 430+ stock ESG matrix.
   G scores for companies in NSE_TO_BSE are fetched live from BSE shareholding API.
   All other stocks use sector-baseline G scores.
   Safe to re-run (idempotent upserts).
*/

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // ── 1. Create tables (idempotent) ────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stock_universe (
        ticker            TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        exchange          TEXT NOT NULL DEFAULT 'NSE',
        sector            TEXT,
        industry          TEXT,
        market_cap        TEXT,
        is_active         BOOLEAN DEFAULT true,
        created_at        TIMESTAMP DEFAULT NOW(),
        esg_e             INTEGER,
        esg_s             INTEGER,
        esg_g             INTEGER,
        esg_tier          TEXT,
        esg_risk          TEXT,
        brsr_mandated     BOOLEAN DEFAULT false,
        esg_notes         TEXT,
        esg_updated_at    TIMESTAMP,
        promoter_holding  REAL,
        promoter_pledge   REAL,
        bse_code          TEXT,
        shareholding_date TEXT
      )
    `)

    // Add columns that may be missing on existing tables
    for (const col of [
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_e INTEGER`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_s INTEGER`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_g INTEGER`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_tier TEXT`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_risk TEXT`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS brsr_mandated BOOLEAN DEFAULT false`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_notes TEXT`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_updated_at TIMESTAMP`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS promoter_holding REAL`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS promoter_pledge REAL`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS bse_code TEXT`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS shareholding_date TEXT`,
      `ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS instrument_type TEXT DEFAULT 'Equity'`,
    ]) {
      await db.execute(sql.raw(col))
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stock_metrics (
        ticker TEXT PRIMARY KEY REFERENCES stock_universe(ticker) ON DELETE CASCADE,
        price TEXT, market_cap_cr TEXT,
        pe REAL, pb REAL, ev_ebitda REAL, roe REAL, roce REAL,
        npm REAL, opm REAL, debt_equity REAL, current_ratio REAL,
        interest_cov REAL, revenue_growth REAL, eps_growth REAL,
        promoter_holding REAL, promoter_pledge REAL, dividend_yield REAL,
        week_52_high TEXT, week_52_low TEXT, dv_score INTEGER,
        raw_data JSONB, fetched_at TIMESTAMP, updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_screens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL, description TEXT,
        columns TEXT[], filters JSONB DEFAULT '{}',
        sort_by TEXT DEFAULT 'name', sort_dir TEXT DEFAULT 'asc',
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // ── 2. Fetch BSE shareholding for tracked companies ───────────────────────
    const trackedTickers = Object.keys(NSE_TO_BSE)
    const shareholdingMap = new Map<string, { holding: number | null; pledge: number | null; bseCode: string | null; date: string | null }>()

    for (const ticker of trackedTickers) {
      const d = await getShareholding(ticker)
      shareholdingMap.set(ticker, {
        holding: d.promoterHolding,
        pledge:  d.promoterPledge,
        bseCode: d.bseCode,
        date:    d.dataDate,
      })
      // Throttle BSE calls (300ms between requests)
      await new Promise(r => setTimeout(r, 300))
    }

    // ── 3. Seed / upsert all stocks with ESG scores ───────────────────────────
    const now = new Date()
    const BATCH = 50
    let upserted = 0

    for (let i = 0; i < STOCK_UNIVERSE.length; i += BATCH) {
      const batch = STOCK_UNIVERSE.slice(i, i + BATCH)
      const rows = batch.map(s => {
        const sh = shareholdingMap.get(s.ticker)
        const scores = computeESGFromData({
          ticker:          s.ticker,
          sector:          s.sector,
          marketCap:       s.marketCap,
          promoterPledge:  sh?.pledge  ?? null,
          promoterHolding: sh?.holding ?? null,
        })

        return {
          ticker:           s.ticker,
          name:             s.name,
          exchange:         s.exchange,
          sector:           s.sector,
          industry:         s.industry,
          marketCap:        s.marketCap,
          instrumentType:   s.instrumentType ?? 'Equity',
          isActive:         true,
          ...scores,
          promoterHolding:  sh?.holding ?? null,
          promoterPledge:   sh?.pledge  ?? null,
          bseCode:          sh?.bseCode ?? NSE_TO_BSE[s.ticker] ?? null,
          shareholdingDate: sh?.date    ?? null,
          esgUpdatedAt:     sh ? now : null,
        }
      })

      await db.insert(stockUniverse).values(rows).onConflictDoUpdate({
        target: stockUniverse.ticker,
        set: {
          esgE:             sql`excluded.esg_e`,
          esgS:             sql`excluded.esg_s`,
          esgG:             sql`excluded.esg_g`,
          esgTier:          sql`excluded.esg_tier`,
          esgRisk:          sql`excluded.esg_risk`,
          brsrMandated:     sql`excluded.brsr_mandated`,
          instrumentType:   sql`excluded.instrument_type`,
          promoterHolding:  sql`excluded.promoter_holding`,
          promoterPledge:   sql`excluded.promoter_pledge`,
          bseCode:          sql`excluded.bse_code`,
          shareholdingDate: sql`excluded.shareholding_date`,
          esgUpdatedAt:     sql`excluded.esg_updated_at`,
        },
      })
      upserted += batch.length
    }

    const bseFetched = trackedTickers.filter(t => shareholdingMap.get(t)?.pledge !== null).length

    return NextResponse.json({
      ok: true,
      message: `ESG matrix seeded for ${upserted} stocks. BSE shareholding fetched for ${bseFetched}/${trackedTickers.length} tracked companies.`,
      total: STOCK_UNIVERSE.length,
      bseFetched,
    })
  } catch (err: any) {
    console.error('[screener/migrate]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
