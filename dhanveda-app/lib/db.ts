import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy singleton — neon() is never called at module load time (build phase).
// It initialises on the first db method access, which only happens at request time.
type DB = ReturnType<typeof drizzle<typeof schema>>
let _db: DB | undefined

function getDb(): DB {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!)
    _db = drizzle(sql, { schema })
  }
  return _db
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop)
  },
})
