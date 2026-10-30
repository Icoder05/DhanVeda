import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { resolveUid } from '@/lib/resolve-uid'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const [user] = await db
    .select({ twoFaEnabled: users.twoFaEnabled })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1)

  return NextResponse.json({ enabled: user?.twoFaEnabled ?? false })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { enable } = await req.json()
  if (typeof enable !== 'boolean') {
    return NextResponse.json({ error: 'enable must be a boolean.' }, { status: 400 })
  }

  await db
    .update(users)
    .set({ twoFaEnabled: enable })
    .where(eq(users.id, uid))

  return NextResponse.json({ success: true, enabled: enable })
}
