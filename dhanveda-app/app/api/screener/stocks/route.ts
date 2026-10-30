import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse } from '@/lib/schema'
import { eq, ilike, and, inArray, asc, desc, sql } from 'drizzle-orm'

const PAGE_SIZE = 30

// ESG tier sort order (A+ best → D worst)
const TIER_ORDER: Record<string, number> = { 'A+': 0, 'A': 1, 'B+': 2, 'B': 3, 'C': 4, 'D': 5 }
const RISK_ORDER: Record<string, number> = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 }

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const page     = Math.max(1, parseInt(p.get('page') ?? '1'))
  const search   = p.get('search')?.trim() ?? ''
  const exchange = p.get('exchange')?.trim() ?? ''
  const mktCap   = p.get('mktCap')?.trim() ?? ''
  const sectors  = p.get('sectors') ? p.get('sectors')!.split(',').filter(Boolean) : []
  const tiers    = p.get('tiers')   ? p.get('tiers')!.split(',').filter(Boolean)   : []
  const risks    = p.get('risks')   ? p.get('risks')!.split(',').filter(Boolean)   : []
  const brsrOnly      = p.get('brsr') === '1'
  const instrumentType = p.get('instrumentType')?.trim() ?? ''
  const sortBy        = p.get('sortBy') ?? 'esgAvg'
  const sortDir       = p.get('sortDir') === 'asc' ? 'asc' : 'desc'

  try {
    const conditions = []
    if (search)             conditions.push(ilike(stockUniverse.name, `%${search}%`))
    if (exchange)           conditions.push(eq(stockUniverse.exchange, exchange))
    if (mktCap)             conditions.push(eq(stockUniverse.marketCap, mktCap))
    if (sectors.length > 0) conditions.push(inArray(stockUniverse.sector as any, sectors))
    if (tiers.length > 0)   conditions.push(inArray(stockUniverse.esgTier as any, tiers))
    if (risks.length > 0)   conditions.push(inArray(stockUniverse.esgRisk as any, risks))
    if (brsrOnly)           conditions.push(eq(stockUniverse.brsrMandated, true))
    if (instrumentType)     conditions.push(eq(stockUniverse.instrumentType, instrumentType))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Sort mapping
    const numericSorts: Record<string, any> = {
      esgE: stockUniverse.esgE, esgS: stockUniverse.esgS, esgG: stockUniverse.esgG,
      name: stockUniverse.name, sector: stockUniverse.sector,
    }
    let orderFn: any
    if (sortBy === 'esgAvg') {
      const avgExpr = sql`(COALESCE(${stockUniverse.esgE},0) + COALESCE(${stockUniverse.esgS},0) + COALESCE(${stockUniverse.esgG},0))`
      orderFn = sortDir === 'asc' ? asc(avgExpr) : desc(avgExpr)
    } else if (sortBy === 'esgTier') {
      // Sort by tier using CASE WHEN for correct A+>A>B+>B>C>D order
      const caseExpr = sql`CASE esg_tier
        WHEN 'A+' THEN 0 WHEN 'A' THEN 1 WHEN 'B+' THEN 2
        WHEN 'B'  THEN 3 WHEN 'C'  THEN 4 WHEN 'D'  THEN 5
        ELSE 6 END`
      orderFn = sortDir === 'asc' ? asc(caseExpr) : desc(caseExpr)
    } else if (sortBy === 'esgRisk') {
      const caseExpr = sql`CASE esg_risk
        WHEN 'Very Low' THEN 0 WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2
        WHEN 'High' THEN 3 WHEN 'Very High' THEN 4 ELSE 5 END`
      orderFn = sortDir === 'asc' ? asc(caseExpr) : desc(caseExpr)
    } else if (numericSorts[sortBy]) {
      orderFn = sortDir === 'asc' ? asc(numericSorts[sortBy]) : desc(numericSorts[sortBy])
    } else {
      orderFn = asc(stockUniverse.name)
    }

    const [rows, countResult] = await Promise.all([
      db.select({
        ticker:       stockUniverse.ticker,
        name:         stockUniverse.name,
        exchange:     stockUniverse.exchange,
        sector:       stockUniverse.sector,
        industry:     stockUniverse.industry,
        marketCap:    stockUniverse.marketCap,
        esgE:         stockUniverse.esgE,
        esgS:         stockUniverse.esgS,
        esgG:         stockUniverse.esgG,
        esgTier:      stockUniverse.esgTier,
        esgRisk:      stockUniverse.esgRisk,
        brsrMandated: stockUniverse.brsrMandated,
        esgNotes:       stockUniverse.esgNotes,
        esgUpdatedAt:   stockUniverse.esgUpdatedAt,
        instrumentType: stockUniverse.instrumentType,
      })
        .from(stockUniverse)
        .where(where)
        .orderBy(orderFn)
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),

      db.select({ count: sql<number>`count(*)` })
        .from(stockUniverse)
        .where(where),
    ])

    return NextResponse.json({
      stocks: rows,
      total:  Number(countResult[0]?.count ?? 0),
      page,
      pageSize: PAGE_SIZE,
    })
  } catch (err: any) {
    console.error('[screener/stocks]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
