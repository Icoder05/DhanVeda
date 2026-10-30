import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, TERMS_VERSION } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = await resolveUid(session)
  if (!uid) {
    return NextResponse.json({ error: 'User not found. Please sign out and sign back in.' }, { status: 404 })
  }

  await db.update(users).set({
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    termsVersion: TERMS_VERSION,
  }).where(eq(users.id, uid))

  return NextResponse.json({ success: true })
}
