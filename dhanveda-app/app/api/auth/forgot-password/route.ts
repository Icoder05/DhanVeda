import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createHmac, randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

function buildToken(email: string): string {
  const exp = Date.now() + 60 * 60 * 1000 // 1 hour
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url')
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Always return 200 to avoid leaking which emails are registered
  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1)

  if (user && user.passwordHash) {
    // Only credentials users can reset password; OAuth-only accounts have no passwordHash
    const token = buildToken(email.trim().toLowerCase())
    try {
      await sendPasswordResetEmail(email.trim(), user.name, token)
    } catch {
      // Don't expose mail errors to the client
    }
  }

  return NextResponse.json({ ok: true })
}
