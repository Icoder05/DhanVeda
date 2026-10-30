import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { generateOTP } from '@/lib/auth-utils'
import { send2FAOtpEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !(session.user as any).pending2FA) {
    return NextResponse.json({ error: 'Not in 2FA challenge.' }, { status: 401 })
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const otp = generateOTP()
  const hash = await bcrypt.hash(otp, 6)
  const expiry = new Date(Date.now() + 10 * 60 * 1000)

  await db.update(users).set({ twoFaOtpHash: hash, twoFaOtpExpiry: expiry }).where(eq(users.id, user.id))
  await send2FAOtpEmail(user.email, user.name, otp)

  return NextResponse.json({ success: true })
}
