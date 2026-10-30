import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { activityLogs } from '@/lib/schema'
import { desc, gte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const days = req.nextUrl.searchParams.get('days') // '1' | '7' | '30' | 'all'
  const cutoff = days && days !== 'all'
    ? new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
    : null

  const rows = cutoff
    ? await db.select().from(activityLogs)
        .where(gte(activityLogs.createdAt, cutoff))
        .orderBy(desc(activityLogs.createdAt))
        .limit(5000)
    : await db.select().from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(5000)

  return NextResponse.json(rows)
}
