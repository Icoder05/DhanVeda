import crypto from 'crypto'

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Signs a short-lived bypass token after OTP verification.
// Format (base64url): userId:timestamp:hmac
export function signBypassToken(userId: string): string {
  const secret = process.env.AUTH_SECRET!
  const ts = Date.now().toString()
  const payload = `${userId}:${ts}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

// Returns true only if the token is valid, belongs to userId, and is < 10 min old.
export function verifyBypassToken(token: string, userId: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const lastColon = decoded.lastIndexOf(':')
    if (lastColon === -1) return false
    const payload = decoded.slice(0, lastColon)
    const sig = decoded.slice(lastColon + 1)
    const colonIdx = payload.indexOf(':')
    if (colonIdx === -1) return false
    const tUserId = payload.slice(0, colonIdx)
    const ts = parseInt(payload.slice(colonIdx + 1), 10)
    if (tUserId !== userId) return false
    if (isNaN(ts) || Date.now() - ts > 10 * 60 * 1000) return false
    const expected = crypto
      .createHmac('sha256', process.env.AUTH_SECRET!)
      .update(payload)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
