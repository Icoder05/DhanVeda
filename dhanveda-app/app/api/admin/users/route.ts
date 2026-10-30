import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db
    .select({
      id:           users.id,
      userId:       users.userId,
      name:         users.name,
      email:        users.email,
      investorType: users.investorType,
      isAdmin:      users.isAdmin,
      esgEnabled:   users.esgEnabled,
      suspended:    users.suspended,
      oauthProvider: users.oauthProvider,
      createdAt:    users.createdAt,
      termsAccepted:   users.termsAccepted,
      termsAcceptedAt: users.termsAcceptedAt,
      termsVersion:    users.termsVersion,
      tokensUsed:   users.tokensUsed,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500)

  return NextResponse.json(rows)
}
