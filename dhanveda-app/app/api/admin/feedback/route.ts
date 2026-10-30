import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feedbacks } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db
    .select()
    .from(feedbacks)
    .orderBy(desc(feedbacks.createdAt))
    .limit(500)

  return NextResponse.json(rows)
}
