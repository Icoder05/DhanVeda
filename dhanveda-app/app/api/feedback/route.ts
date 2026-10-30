import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feedbacks } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { resolveUid } from '@/lib/resolve-uid'

const VALID_CATEGORIES = ['Bug', 'Feature Request', 'General'] as const

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { category, title, description } = await req.json()

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
  }
  if (title.trim().length > 120) {
    return NextResponse.json({ error: 'Title must be under 120 characters.' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
  }

  await db.insert(feedbacks).values({
    userId:      uid,
    userName:    session.user.name ?? 'Unknown',
    userEmail:   session.user.email ?? '',
    category:    category,
    title:       title.trim(),
    description: description.trim(),
    status:      'Open',
  })

  return NextResponse.json({ success: true })
}
