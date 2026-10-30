import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { portfolioTransactions, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

function dbErrMsg(err: unknown): string {
  const e = err as any
  // Neon's NeonDbError puts the real Postgres reason in .detail / .code, not .message
  if (e?.detail) return `${e.detail}${e.code ? ` [${e.code}]` : ''}`
  if (e?.code && e?.message) return `${e.message} [${e.code}]`
  return e?.message ?? String(err)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const uid = await resolveUid(session)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(portfolioTransactions)
      .where(eq(portfolioTransactions.userId, uid))
      .orderBy(desc(portfolioTransactions.date))

    return NextResponse.json(rows)
  } catch (err: unknown) {
    console.error('[portfolio GET] ERROR:', dbErrMsg(err))
    return NextResponse.json({ error: dbErrMsg(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const uid = await resolveUid(session)
    if (!uid) {
      return NextResponse.json({ error: 'Your account was not found. Please sign out and sign back in.' }, { status: 401 })
    }

    const { assetName, assetType, subCategory, action, units, price, date, notes } = await req.json()

    if (!assetName || !assetType || !action || !units || !price || !date) {
      return NextResponse.json({ error: 'assetName, assetType, action, units, price, date are required.' }, { status: 400 })
    }
    if (!['Buy', 'Sell'].includes(action)) {
      return NextResponse.json({ error: 'action must be Buy or Sell.' }, { status: 400 })
    }

    const [row] = await db
      .insert(portfolioTransactions)
      .values({
        userId: uid,
        assetName,
        assetType,
        subCategory: subCategory || null,
        action,
        units: parseFloat(units),
        price: parseFloat(price),
        date: new Date(date),
        notes: notes || null,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    const msg = dbErrMsg(err)
    console.error('[portfolio POST] ERROR:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
