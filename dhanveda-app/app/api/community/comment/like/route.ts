import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { commentLikes, postComments } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUid(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await req.json()
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })

  const cid = Number(commentId)

  const comment = await db.select().from(postComments).where(eq(postComments.id, cid)).limit(1)
  if (!comment[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, cid), eq(commentLikes.userId, userId))).limit(1)

  if (existing[0]) {
    await db.delete(commentLikes).where(and(eq(commentLikes.commentId, cid), eq(commentLikes.userId, userId)))
    const newCount = Math.max(0, (comment[0].likeCount ?? 0) - 1)
    await db.update(postComments).set({ likeCount: newCount }).where(eq(postComments.id, cid))
    return NextResponse.json({ liked: false, likeCount: newCount })
  } else {
    await db.insert(commentLikes).values({ commentId: cid, userId })
    const newCount = (comment[0].likeCount ?? 0) + 1
    await db.update(postComments).set({ likeCount: newCount }).where(eq(postComments.id, cid))
    return NextResponse.json({ liked: true, likeCount: newCount })
  }
}
