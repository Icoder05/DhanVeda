import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { journalEntries } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const uid = await resolveUid(session)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, uid))
      .orderBy(desc(journalEntries.createdAt))
      .limit(50)
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error('[journal GET]', err.message)
    return NextResponse.json({ error: err.message ?? 'Failed to load journal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stock, action, reason, conviction } = await req.json()
  if (!stock || !reason) return NextResponse.json({ error: 'stock and reason required' }, { status: 400 })

  try {
    const uid = await resolveUid(session)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [entry] = await db
      .insert(journalEntries)
      .values({ userId: uid, stock, action, reason, conviction })
      .returning()

    return NextResponse.json(entry)
  } catch (err: any) {
    console.error('[journal POST]', err.message)
    return NextResponse.json({ error: err.message ?? 'Failed to save entry' }, { status: 500 })
  }
}
