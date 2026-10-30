import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens_used bigint NOT NULL DEFAULT 0
  `)

  return NextResponse.json({ ok: true, message: 'tokens_used column ready' })
}
