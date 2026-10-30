import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

const VALID_INVESTOR_TYPES = [
  'Retail Investor', 'HNI (High Net Worth)', 'Active Trader',
  'Long-term Investor', 'ESG-Focused Investor',
]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.esgEnabled !== undefined)   updates.esgEnabled   = Boolean(body.esgEnabled)
  if (body.isAdmin !== undefined)       updates.isAdmin      = Boolean(body.isAdmin)
  if (body.suspended !== undefined)     updates.suspended    = Boolean(body.suspended)
  if (body.investorType !== undefined) {
    if (!VALID_INVESTOR_TYPES.includes(body.investorType)) {
      return NextResponse.json({ error: 'Invalid investor type.' }, { status: 400 })
    }
    updates.investorType = body.investorType
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  // Prevent admin from revoking their own admin status
  if (id === session?.user?.id && updates.isAdmin === false) {
    return NextResponse.json({ error: 'Cannot revoke your own admin status.' }, { status: 400 })
  }

  await db.update(users).set(updates).where(eq(users.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === session?.user?.id) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  }

  await db.delete(users).where(eq(users.id, id))
  return NextResponse.json({ success: true })
}
