import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { portfolioTransactions } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rowId = parseInt(id)
  if (isNaN(rowId)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })

  const { assetName, assetType, subCategory, action, units, price, date, notes } = await req.json()

  if (!assetName || !assetType || !action || !units || !price || !date) {
    return NextResponse.json({ error: 'assetName, assetType, action, units, price, date are required.' }, { status: 400 })
  }

  try {
    const [row] = await db
      .update(portfolioTransactions)
      .set({
        assetName,
        assetType,
        subCategory: subCategory || null,
        action,
        units: parseFloat(units),
        price: parseFloat(price),
        date: new Date(date),
        notes: notes || null,
      })
      .where(and(
        eq(portfolioTransactions.id, rowId),
        eq(portfolioTransactions.userId, uid),
      ))
      .returning()

    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rowId = parseInt(id)
  if (isNaN(rowId)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })

  try {
    await db
      .delete(portfolioTransactions)
      .where(and(
        eq(portfolioTransactions.id, rowId),
        eq(portfolioTransactions.userId, uid),
      ))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Delete failed' }, { status: 500 })
  }
}
