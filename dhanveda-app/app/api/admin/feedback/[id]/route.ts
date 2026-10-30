import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feedbacks } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['Open', 'In Progress', 'Resolved'] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const feedbackId = parseInt(id, 10)
  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    updates.status = body.status
  }
  if (body.adminNote !== undefined) {
    updates.adminNote = body.adminNote ?? null
  }

  await db.update(feedbacks).set(updates).where(eq(feedbacks.id, feedbackId))
  return NextResponse.json({ success: true })
}
