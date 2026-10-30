import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, activityLogs } from '@/lib/schema'
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

  const [allUsers, recentLogs] = await Promise.all([
    db.select({
      id:           users.id,
      userId:       users.userId,
      name:         users.name,
      investorType: users.investorType,
      tokensUsed:   users.tokensUsed,
    }).from(users).limit(500),

    cutoff
      ? db.select().from(activityLogs)
          .where(gte(activityLogs.createdAt, cutoff))
          .orderBy(desc(activityLogs.createdAt))
          .limit(5000)
      : db.select().from(activityLogs)
          .orderBy(desc(activityLogs.createdAt))
          .limit(5000),
  ])

  // Group logs by userId
  const logsByUser: Record<string, typeof recentLogs> = {}
  for (const log of recentLogs) {
    if (!log.userId) continue
    if (!logsByUser[log.userId]) logsByUser[log.userId] = []
    logsByUser[log.userId].push(log)
  }

  const rows = allUsers.map(u => {
    const userLogs = logsByUser[u.id] ?? []
    const lastActivity = userLogs[0]?.createdAt ?? null
    const recentActions = userLogs
      .slice(0, 4)
      .map(l => l.feature + (l.stock ? ` (${l.stock})` : ''))
      .join(' · ')
    return {
      userId:        u.userId ?? '—',
      name:          u.name,
      tokensUsed:    u.tokensUsed ?? 0,
      investorType:  u.investorType ?? 'Retail Investor',
      recentActions: recentActions || '—',
      lastActivity:  lastActivity ? lastActivity.toISOString() : null,
    }
  })

  rows.sort((a, b) => {
    if (!a.lastActivity && !b.lastActivity) return 0
    if (!a.lastActivity) return 1
    if (!b.lastActivity) return -1
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  })

  return NextResponse.json(rows)
}
