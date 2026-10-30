/**
 * One-time script: sets a password + marks account as admin + ensures emailVerified
 * Run: node scripts/set-admin-password.mjs
 * Requires DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD in the environment
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')
const { neon } = require('@neondatabase/serverless')

const EMAIL  = process.env.ADMIN_EMAIL
const NEW_PASSWORD = process.env.ADMIN_PASSWORD

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL is not set. Run:\n  $env:DATABASE_URL="<your-neon-url>"; node scripts/set-admin-password.mjs')
    process.exit(1)
  }
  if (!EMAIL || !NEW_PASSWORD) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must both be set.')
    process.exit(1)
  }

  const sql = neon(dbUrl)

  // Check if user exists
  const rows = await sql`SELECT id, email, password_hash, is_admin, email_verified FROM users WHERE email = ${EMAIL}`
  if (rows.length === 0) {
    console.error(`ERROR: No user found with email ${EMAIL}`)
    console.error('Make sure you have signed up at least once (via Google or email).')
    process.exit(1)
  }

  const user = rows[0]
  console.log('Found user:')
  console.log(`  ID:             ${user.id}`)
  console.log(`  Email:          ${user.email}`)
  console.log(`  Has password:   ${user.password_hash ? 'yes' : 'NO (OAuth-only account)'}`)
  console.log(`  is_admin:       ${user.is_admin}`)
  console.log(`  email_verified: ${user.email_verified}`)

  const hash = await bcrypt.hash(NEW_PASSWORD, 10)

  await sql`
    UPDATE users
    SET
      password_hash   = ${hash},
      is_admin        = true,
      email_verified  = true,
      terms_accepted  = true
    WHERE email = ${EMAIL}
  `

  console.log('\n✅ Done!')
  console.log('   is_admin = true, email_verified = true')
  console.log('\nNow log in at http://localhost:3000/admin/login')
  console.log(`   Email:    ${EMAIL}`)
  console.log('\nChange your password after logging in if you wish.')
}

main().catch(err => { console.error(err); process.exit(1) })
