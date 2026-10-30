import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(200)
  return NextResponse.json(rows)
}
