import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userScreens } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const screens = await db.select()
      .from(userScreens)
      .where(eq(userScreens.userId, uid))
      .orderBy(userScreens.createdAt)

    return NextResponse.json(screens)
  } catch (err: any) {
    console.error('[screener/screens GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, columns, filters, sortBy, sortDir } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  try {
    const [screen] = await db.insert(userScreens)
      .values({
        userId:      uid,
        name:        name.trim(),
        description: description ?? null,
        columns:     columns ?? [],
        filters:     filters ?? {},
        sortBy:      sortBy ?? 'name',
        sortDir:     sortDir ?? 'asc',
      })
      .returning()

    return NextResponse.json(screen)
  } catch (err: any) {
    console.error('[screener/screens POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, description, columns, filters, sortBy, sortDir } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const [screen] = await db.update(userScreens)
      .set({
        name: name?.trim(),
        description,
        columns,
        filters,
        sortBy,
        sortDir,
        updatedAt: new Date(),
      })
      .where(and(eq(userScreens.id, id), eq(userScreens.userId, uid)))
      .returning()

    return NextResponse.json(screen)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = await resolveUid(session)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await db.delete(userScreens)
      .where(and(eq(userScreens.id, id), eq(userScreens.userId, uid)))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
