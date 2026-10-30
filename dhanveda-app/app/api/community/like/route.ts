import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { postLikes, communityPosts } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const pid = Number(postId)

  try {
    const existing = await db.select().from(postLikes).where(and(eq(postLikes.postId, pid), eq(postLikes.userId, uid))).limit(1)

    const post = await db.select().from(communityPosts).where(eq(communityPosts.id, pid)).limit(1)
    if (!post[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    if (existing[0]) {
      await db.delete(postLikes).where(and(eq(postLikes.postId, pid), eq(postLikes.userId, uid)))
      const newCount = Math.max(0, (post[0].likeCount ?? 0) - 1)
      await db.update(communityPosts).set({ likeCount: newCount }).where(eq(communityPosts.id, pid))
      return NextResponse.json({ liked: false, likeCount: newCount })
    } else {
      await db.insert(postLikes).values({ postId: pid, userId: uid })
      const newCount = (post[0].likeCount ?? 0) + 1
      await db.update(communityPosts).set({ likeCount: newCount }).where(eq(communityPosts.id, pid))
      return NextResponse.json({ liked: true, likeCount: newCount })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Like failed' }, { status: 500 })
  }
}
