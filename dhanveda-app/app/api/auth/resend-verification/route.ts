import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pendingSignups } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { generateOTP } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })

  const normalizedEmail = (email as string).toLowerCase().trim()

  const [pending] = await db
    .select()
    .from(pendingSignups)
    .where(eq(pendingSignups.email, normalizedEmail))
    .limit(1)

  // Return success even if not found — avoids email enumeration
  if (!pending) return NextResponse.json({ success: true })

  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 6)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db
    .update(pendingSignups)
    .set({ token: otpHash, expiresAt })
    .where(eq(pendingSignups.id, pending.id))

  await sendVerificationEmail(normalizedEmail, pending.name, otp)
  return NextResponse.json({ success: true })
}
