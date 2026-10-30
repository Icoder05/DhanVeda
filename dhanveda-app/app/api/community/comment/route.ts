import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { postComments, communityPosts, commentLikes } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

function displayName(fullName: string | null | undefined) {
  if (!fullName) return 'User'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const session = await auth()

  const comments = await db
    .select()
    .from(postComments)
    .where(and(eq(postComments.postId, Number(postId)), eq(postComments.isDeleted, false)))

  // Resolve UUID for liked/own checks (tolerates stale OAuth sessions)
  let uid: string | null = null
  try { uid = session ? await resolveUid(session) : null } catch {}

  let likedIds = new Set<number>()
  if (uid) {
    try {
      const likes = await db.select().from(commentLikes).where(eq(commentLikes.userId, uid))
      likedIds = new Set(likes.map(l => Number(l.commentId)))
    } catch {}
  }

  return NextResponse.json(comments.map(c => ({ ...c, liked: likedIds.has(c.id), isOwn: c.userId === uid })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, content, parentId } = await req.json()
  if (!postId || !content?.trim()) return NextResponse.json({ error: 'postId and content required' }, { status: 400 })

  try {
    const [comment] = await db.insert(postComments).values({
      postId: Number(postId),
      userId: uid,
      userName: displayName(session.user.name),
      content: content.trim(),
      ...(parentId ? { parentId: Number(parentId) } : {}),
    }).returning()

    const post = await db.select().from(communityPosts).where(eq(communityPosts.id, Number(postId))).limit(1)
    if (post[0]) {
      await db.update(communityPosts).set({ commentCount: (post[0].commentCount ?? 0) + 1 }).where(eq(communityPosts.id, Number(postId)))
    }

    return NextResponse.json({ ...comment, liked: false, isOwn: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to post comment' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, content } = await req.json()
  if (!id || !content?.trim()) return NextResponse.json({ error: 'id and content required' }, { status: 400 })

  const existing = await db.select().from(postComments).where(eq(postComments.id, Number(id))).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [updated] = await db.update(postComments)
    .set({ content: content.trim(), updatedAt: new Date() })
    .where(eq(postComments.id, Number(id)))
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

  const existing = await db.select().from(postComments).where(eq(postComments.id, Number(id))).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.update(postComments).set({ isDeleted: true, updatedAt: new Date() }).where(eq(postComments.id, Number(id)))

  const post = await db.select().from(communityPosts).where(eq(communityPosts.id, Number(existing[0].postId))).limit(1)
  if (post[0]) {
    await db.update(communityPosts).set({ commentCount: Math.max(0, (post[0].commentCount ?? 0) - 1) }).where(eq(communityPosts.id, Number(existing[0].postId)))
  }

  return NextResponse.json({ ok: true })
}
