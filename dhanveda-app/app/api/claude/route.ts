import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { callClaude } from '@/lib/claude'
import { db } from '@/lib/db'
import { activityLogs } from '@/lib/schema'
import { resolveUid } from '@/lib/resolve-uid'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { prompt, maxTokens, webSearch, feature, stock } = body

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  let result: unknown
  try {
    result = await callClaude({ prompt, maxTokens, webSearch })
  } catch (err: any) {
    console.error('[claude]', err)
    return NextResponse.json({ error: err.message ?? 'Claude error' }, { status: 500 })
  }

  // Track activity + tokens — never break the main response on failure
  try {
    const uid = await resolveUid(session)
    if (uid) {
      // Estimate: input ≈ prompt chars / 4, output ≈ maxTokens requested
      const estimatedTokens = Math.round(prompt.length / 4) + (maxTokens ?? 2500)
      const ops: Promise<unknown>[] = [
        db.execute(sql`UPDATE users SET tokens_used = COALESCE(tokens_used, 0) + ${estimatedTokens} WHERE id = ${uid}`),
      ]
      if (feature) {
        ops.push(
          db.insert(activityLogs).values({
            userId: uid,
            userName: session.user.name ?? '',
            feature,
            stock: stock ?? null,
          })
        )
      }
      await Promise.all(ops)
    }
  } catch (logErr: any) {
    console.error('[claude] tracking failed (non-fatal):', logErr.message)
  }

  return NextResponse.json(result)
}
