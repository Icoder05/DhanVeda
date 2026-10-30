import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pendingSignups } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { validateEmail } from '@/lib/email-validator'
import { generateOTP } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email'
import { TERMS_VERSION } from '@/lib/schema'

const USERID_RE = /^[a-z][a-z0-9_]{2,19}$/

export async function POST(req: NextRequest) {
  const { name, email, password, userId, investorType, termsAccepted, termsVersion } = await req.json()

  if (!name || !email || !password || !userId) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }
  if (termsAccepted !== true) {
    return NextResponse.json({ error: 'You must accept the Terms & Conditions to create an account.' }, { status: 400 })
  }

  const normalizedUserId = (userId as string).toLowerCase().trim()
  if (!USERID_RE.test(normalizedUserId)) {
    return NextResponse.json({
      error: 'User ID must be 3–20 characters, start with a letter, and contain only letters, numbers, or underscores.',
    }, { status: 400 })
  }

  // Check userId uniqueness
  const [takenId] = await db.select({ id: users.id }).from(users).where(eq(users.userId, normalizedUserId)).limit(1)
  if (takenId) {
    return NextResponse.json({ error: 'User ID already exists. Please choose another.' }, { status: 409 })
  }

  const normalizedEmail = (email as string).trim().toLowerCase()

  const emailCheck = await validateEmail(normalizedEmail)
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.reason ?? 'Invalid email address.' }, { status: 400 })
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  if (existingUser) {
    return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
  }

  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 6)
  const passwordHash = await bcrypt.hash(password, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db
    .insert(pendingSignups)
    .values({
      userId: normalizedUserId,
      name: (name as string).trim(),
      email: normalizedEmail,
      passwordHash,
      investorType: investorType ?? 'Retail Investor',
      termsVersion: termsVersion ?? TERMS_VERSION,
      token: otpHash,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: pendingSignups.email,
      set: { userId: normalizedUserId, name: (name as string).trim(), passwordHash, token: otpHash, expiresAt },
    })

  await sendVerificationEmail(normalizedEmail, (name as string).trim(), otp)

  return NextResponse.json({ success: true, requiresVerification: true })
}
