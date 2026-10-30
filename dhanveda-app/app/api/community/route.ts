import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityPosts, postLikes } from '@/lib/schema'
import { desc, eq, and } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

function displayName(fullName: string | null | undefined) {
  if (!fullName) return 'User'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const category = req.nextUrl.searchParams.get('category') ?? 'stock'

  const posts = await db
    .select()
    .from(communityPosts)
    .where(and(eq(communityPosts.category, category), eq(communityPosts.isDeleted, false)))
    .orderBy(desc(communityPosts.createdAt))
    .limit(60)

  // Resolve user UUID for likes (stale OAuth sessions get email recovery)
  let likedIds = new Set<number>()
  try {
    const uid = session ? await resolveUid(session) : null
    if (uid) {
      const likes = await db.select().from(postLikes).where(eq(postLikes.userId, uid))
      likedIds = new Set(likes.map(l => Number(l.postId)))
    }
  } catch {}

  return NextResponse.json(posts.map(p => ({ ...p, liked: likedIds.has(p.id) })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stock, content, sentiment, category, topic, repostOfId, repostComment } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const cat = category ?? 'stock'
  const topicVal = topic?.trim() || stock?.trim() || 'General'

  try {
    const [post] = await db
      .insert(communityPosts)
      .values({
        userId: uid,
        stock: topicVal,
        content: content.trim(),
        sentiment: sentiment ?? 'neutral',
        userName: displayName(session.user.name),
        category: cat,
        topic: topicVal,
        ...(repostOfId ? { repostOfId: Number(repostOfId), repostComment: repostComment?.trim() } : {}),
      })
      .returning()

    if (repostOfId) {
      const orig = await db.select().from(communityPosts).where(eq(communityPosts.id, Number(repostOfId))).limit(1)
      if (orig[0]) {
        await db.update(communityPosts)
          .set({ repostCount: (orig[0].repostCount ?? 0) + 1 })
          .where(eq(communityPosts.id, Number(repostOfId)))
      }
    }

    return NextResponse.json({ ...post, liked: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to create post' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, content, topic, sentiment } = await req.json()
  if (!id || !content?.trim()) return NextResponse.json({ error: 'id and content required' }, { status: 400 })

  const existing = await db.select().from(communityPosts).where(eq(communityPosts.id, Number(id))).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [updated] = await db.update(communityPosts)
    .set({ content: content.trim(), topic: topic?.trim() || existing[0].topic, stock: topic?.trim() || existing[0].stock, sentiment: sentiment ?? existing[0].sentiment, updatedAt: new Date() })
    .where(eq(communityPosts.id, Number(id)))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const existing = await db.select().from(communityPosts).where(eq(communityPosts.id, Number(id))).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.update(communityPosts).set({ isDeleted: true, updatedAt: new Date() }).where(eq(communityPosts.id, Number(id)))
  return NextResponse.json({ ok: true })
}
