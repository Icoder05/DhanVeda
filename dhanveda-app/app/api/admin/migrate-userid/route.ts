import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

function baseFromName(name: string): string {
  return name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 15) || 'user'
}

function randSuffix(): string {
  return String(Math.floor(Math.random() * 90) + 10)
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Add user_id column if it doesn't exist
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id text;
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_user_id_unique ON users(user_id);
  `)

  // 2. Also add user_id to pending_signups if it doesn't exist
  await db.execute(sql`
    ALTER TABLE pending_signups ADD COLUMN IF NOT EXISTS user_id text;
  `)

  // 3. Find all users without a userId
  const usersWithoutId = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(isNull(users.userId))

  const takenIds = new Set<string>()
  // Pre-load already-assigned ids from DB to avoid collisions
  const allAssigned = await db.select({ userId: users.userId }).from(users)
  allAssigned.forEach(r => { if (r.userId) takenIds.add(r.userId) })

  let updated = 0
  for (const user of usersWithoutId) {
    const base = baseFromName(user.name)
    let candidate = ''
    for (let attempt = 0; attempt < 100; attempt++) {
      candidate = base + randSuffix()
      if (!takenIds.has(candidate)) break
    }
    takenIds.add(candidate)
    await db.execute(sql`UPDATE users SET user_id = ${candidate} WHERE id = ${user.id}`)
    updated++
  }

  return NextResponse.json({
    success: true,
    message: `Column ensured. Assigned userId to ${updated} existing user(s).`,
    updated,
  })
}
