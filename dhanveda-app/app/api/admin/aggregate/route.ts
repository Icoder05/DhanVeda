import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// GET  — returns current stats (raw log count, oldest log, last archive date)
// POST — archives logs older than 90 days into daily_stats, then deletes them

export async function GET() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Ensure daily_stats table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id      BIGSERIAL PRIMARY KEY,
      date    TEXT    NOT NULL,
      feature TEXT    NOT NULL,
      stock   TEXT,
      count   INTEGER NOT NULL DEFAULT 0
    )
  `)

  const [rawCount, oldestLog, latestArchive] = await Promise.all([
    db.execute(sql`SELECT COUNT(*)::int AS n FROM activity_logs`),
    db.execute(sql`SELECT MIN(created_at) AS oldest FROM activity_logs`),
    db.execute(sql`SELECT MAX(date) AS last_date FROM daily_stats`),
  ])

  return NextResponse.json({
    rawLogCount:   (rawCount.rows[0] as any)?.n ?? 0,
    oldestLog:     (oldestLog.rows[0] as any)?.oldest ?? null,
    lastArchived:  (latestArchive.rows[0] as any)?.last_date ?? null,
    retentionDays: 90,
  })
}

export async function POST() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 1. Ensure table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id      BIGSERIAL PRIMARY KEY,
      date    TEXT    NOT NULL,
      feature TEXT    NOT NULL,
      stock   TEXT,
      count   INTEGER NOT NULL DEFAULT 0
    )
  `)

  // 2. Count rows eligible for archiving (older than 90 days)
  const eligibleResult = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
  `)
  const eligible = (eligibleResult.rows[0] as any)?.n ?? 0

  if (eligible === 0) {
    return NextResponse.json({ archived: 0, deleted: 0, message: 'Nothing to archive — all logs are within 90 days.' })
  }

  // 3. Delete existing daily_stats for the dates we are about to re-aggregate
  //    (makes the operation idempotent: safe to run multiple times)
  await db.execute(sql`
    DELETE FROM daily_stats
    WHERE date IN (
      SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM-DD')
      FROM activity_logs
      WHERE created_at < NOW() - INTERVAL '90 days'
    )
  `)

  // 4. Insert aggregated rows from old raw logs
  await db.execute(sql`
    INSERT INTO daily_stats (date, feature, stock, count)
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
      feature,
      stock,
      COUNT(*)::int AS count
    FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), feature, stock
  `)

  // 5. Delete the now-archived raw rows
  const deleteResult = await db.execute(sql`
    DELETE FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  `)
  const deleted = deleteResult.rows.length

  return NextResponse.json({
    archived: eligible,
    deleted,
    message: `Archived ${eligible} events into daily summaries and removed them from raw logs.`,
  })
}
