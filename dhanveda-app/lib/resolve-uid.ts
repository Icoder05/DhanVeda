import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resolves the authenticated user's DB UUID from the session.
 *
 * Two failure modes are handled:
 * 1. token.id is not a UUID at all (OAuth sub-ID like "115xxx" from a pre-fix session)
 * 2. token.id IS a valid UUID format but the row no longer exists (rotated DB, env mismatch)
 *
 * In both cases we fall back to an email lookup so stale sessions keep working
 * without requiring a sign-out.
 *
 * Returns null when no valid user can be found.
 */
export async function resolveUid(
  session: { user?: { id?: string | null; email?: string | null } } | null,
): Promise<string | null> {
  if (!session?.user) return null

  const uid = session.user.id ?? ''

  if (UUID_RE.test(uid)) {
    // Verify the UUID actually exists in the users table.
    // Guards against tokens that reference a deleted/migrated row or a different env.
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, uid))
      .limit(1)
    if (row) return row.id
    // UUID not found — fall through to email recovery
    console.warn('[resolveUid] UUID not in users table, falling back to email:', uid)
  }

  // Either not a UUID format OR UUID missing from DB — try email lookup
  const email = session.user.email
  if (!email) return null

  const [byEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  return byEmail?.id ?? null
}
