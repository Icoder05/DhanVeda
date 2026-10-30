import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createHmac } from 'crypto'
import bcrypt from 'bcryptjs'

function verifyToken(token: string): { email: string } | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null

    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    if (!secret) throw new Error('AUTH_SECRET is not set')
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    if (sig !== expected) return null

    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!email || !exp || Date.now() > exp) return null

    return { email }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const verified = verifyToken(token)
  if (!verified) {
    return NextResponse.json({ error: 'Reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, verified.email))
    .limit(1)

  if (!user || !user.passwordHash) {
    // OAuth-only account or non-existent — don't reveal which
    return NextResponse.json({ error: 'Reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(password, 10)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}
