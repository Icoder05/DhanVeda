import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const VALID = /^[a-z][a-z0-9_]{2,19}$/

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.toLowerCase().trim() ?? ''

  if (!id) return NextResponse.json({ available: false, error: 'ID required' }, { status: 400 })

  if (!VALID.test(id)) {
    return NextResponse.json({
      available: false,
      error: '3–20 chars, start with a letter, only letters/numbers/underscores.',
    })
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.userId, id))
    .limit(1)

  return NextResponse.json({ available: !existing })
}
