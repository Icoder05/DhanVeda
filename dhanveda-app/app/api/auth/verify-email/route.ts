import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pendingSignups } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json()

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 })
  }

  const normalizedEmail = (email as string).toLowerCase().trim()

  const [pending] = await db
    .select()
    .from(pendingSignups)
    .where(eq(pendingSignups.email, normalizedEmail))
    .limit(1)

  if (!pending) {
    return NextResponse.json({ error: 'No pending signup found. Please sign up again.' }, { status: 404 })
  }

  if (pending.expiresAt < new Date()) {
    await db.delete(pendingSignups).where(eq(pendingSignups.id, pending.id))
    return NextResponse.json({ error: 'Code expired. Please sign up again to get a new code.' }, { status: 410 })
  }

  const valid = await bcrypt.compare(otp.trim(), pending.token)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect code. Please check your email and try again.' }, { status: 400 })
  }

  // Create the user only after OTP is confirmed correct
  const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  if (!existingUser) {
    await db.insert(users).values({
      userId: pending.userId ?? undefined,
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      investorType: pending.investorType ?? 'Retail Investor',
      emailVerified: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: pending.termsVersion,
    })
  }

  await db.delete(pendingSignups).where(eq(pendingSignups.id, pending.id))

  return NextResponse.json({ success: true })
}
