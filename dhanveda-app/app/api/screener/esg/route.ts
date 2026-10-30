import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse } from '@/lib/schema'
import { eq, ilike, sql } from 'drizzle-orm'

// GET /api/screener/esg?ticker=TCS  — returns full ESG row for one stock
// Also accepts ?name=Tata+Consultancy for lookup by partial name
// Self-heals missing columns on first request after a schema update

async function addMissingColumns() {
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_e real`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_s real`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_g real`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_tier text`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_risk text`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS brsr_mandated boolean`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_notes text`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS esg_updated_at timestamptz`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS promoter_holding real`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS promoter_pledge real`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS bse_code text`)
  await db.execute(sql`ALTER TABLE stock_universe ADD COLUMN IF NOT EXISTS shareholding_date text`)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const ticker = p.get('ticker')?.trim().toUpperCase()
  const name   = p.get('name')?.trim()

  if (!ticker && !name) {
    return NextResponse.json({ error: 'ticker or name required' }, { status: 400 })
  }

  async function runQuery() {
    let rows: (typeof stockUniverse.$inferSelect)[] = []

    if (ticker) {
      // If the ticker param contains spaces it's actually a company name (AI sometimes returns full names)
      if (ticker.includes(' ')) {
        rows = await db.select().from(stockUniverse).where(ilike(stockUniverse.name, `%${ticker}%`)).limit(1)
      } else {
        rows = await db.select().from(stockUniverse).where(eq(stockUniverse.ticker, ticker)).limit(1)
        // Fallback: try name search if exact ticker not found
        if (!rows.length) {
          rows = await db.select().from(stockUniverse).where(ilike(stockUniverse.name, `%${ticker}%`)).limit(1)
        }
      }
    } else {
      rows = await db.select().from(stockUniverse).where(ilike(stockUniverse.name, `%${name}%`)).limit(1)
    }

    if (!rows.length) {
      return NextResponse.json(
        { error: `"${ticker ?? name}" not found. Enter the NSE ticker symbol (e.g. TCS, INFY) or run "Initialize ESG Matrix" from the screener first.` },
        { status: 404 }
      )
    }
    return NextResponse.json(rows[0])
  }

  try {
    return await runQuery()
  } catch (_err: any) {
    // Neon surfaces column-not-exist as "Failed query: ..." rather than a typed column error.
    // ALTER TABLE ... IF NOT EXISTS is idempotent — safe to run on any DB failure.
    try {
      await addMissingColumns()
      return await runQuery()
    } catch (e2: any) {
      console.error('[screener/esg]', e2)
      return NextResponse.json({ error: e2.message }, { status: 500 })
    }
  }
}
