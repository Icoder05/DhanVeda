import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getShareholding } from '@/lib/bseApi'
import { computeESGFromData } from '@/lib/esgScoring'

// POST { ticker } — fetches latest BSE shareholding data for a single stock,
// runs through the scoring algorithm, and updates the DB.
// Use this to refresh a specific company's G score after a quarterly shareholding update.

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker } = await req.json()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const t = String(ticker).trim().toUpperCase()

  try {
    const rows = await db.select().from(stockUniverse).where(eq(stockUniverse.ticker, t)).limit(1)
    const stock = rows[0]
    if (!stock) return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 })

    const sh = await getShareholding(t)

    if (!sh.bseCode) {
      return NextResponse.json({
        error: `No BSE code mapped for ${t}. Add to NSE_TO_BSE in lib/bseApi.ts.`,
      }, { status: 422 })
    }

    const scores = computeESGFromData({
      ticker:          t,
      sector:          stock.sector,
      marketCap:       stock.marketCap,
      promoterPledge:  sh.promoterPledge,
      promoterHolding: sh.promoterHolding,
    })

    await db.update(stockUniverse).set({
      ...scores,
      promoterHolding:  sh.promoterHolding,
      promoterPledge:   sh.promoterPledge,
      bseCode:          sh.bseCode,
      shareholdingDate: sh.dataDate,
      esgUpdatedAt:     new Date(),
    }).where(eq(stockUniverse.ticker, t))

    return NextResponse.json({
      ticker: t,
      ...scores,
      promoterHolding:  sh.promoterHolding,
      promoterPledge:   sh.promoterPledge,
      bseCode:          sh.bseCode,
      shareholdingDate: sh.dataDate,
    })
  } catch (err: any) {
    console.error('[screener/bse-refresh]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
