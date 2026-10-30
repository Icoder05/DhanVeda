import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { signBypassToken } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  if (!(session.user as any).pending2FA) {
    return NextResponse.json({ error: 'No 2FA challenge pending.' }, { status: 400 })
  }

  const { otp } = await req.json()
  if (!otp || typeof otp !== 'string') {
    return NextResponse.json({ error: 'OTP is required.' }, { status: 400 })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.twoFaOtpHash || !user.twoFaOtpExpiry) {
    return NextResponse.json({ error: 'No OTP found. Please log in again.' }, { status: 400 })
  }

  if (new Date() > user.twoFaOtpExpiry) {
    return NextResponse.json({ error: 'Code expired. Please log in again.' }, { status: 400 })
  }

  const valid = await bcrypt.compare(otp.trim(), user.twoFaOtpHash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect code. Check your email and try again.' }, { status: 401 })
  }

  // Issue a short-lived signed bypass token — client uses it to re-authenticate cleanly
  const bypassToken = signBypassToken(user.id)
  return NextResponse.json({ bypassToken, userId: user.userId })
}
