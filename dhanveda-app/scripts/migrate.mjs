// Run with: node scripts/migrate.mjs
// 1. Creates all missing tables (IF NOT EXISTS)
// 2. Adds any missing columns (ADD COLUMN IF NOT EXISTS)
// Safe to run multiple times — idempotent.

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Create tables that may not exist yet
// ─────────────────────────────────────────────────────────────────
const createStatements = [
  [`CREATE TABLE IF NOT EXISTS users (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                       TEXT NOT NULL,
    email                      TEXT NOT NULL UNIQUE,
    password_hash              TEXT,
    investor_type              TEXT DEFAULT 'Retail Investor',
    is_admin                   BOOLEAN DEFAULT false,
    esg_enabled                BOOLEAN DEFAULT true,
    risk_tolerance             TEXT DEFAULT 'Moderate',
    investment_horizon         TEXT DEFAULT '5+ years',
    created_at                 TIMESTAMP DEFAULT now(),
    email_verified             BOOLEAN NOT NULL DEFAULT true,
    email_verification_token   TEXT,
    email_verification_expiry  TIMESTAMP,
    two_fa_enabled             BOOLEAN NOT NULL DEFAULT false,
    two_fa_otp_hash            TEXT,
    two_fa_otp_expiry          TIMESTAMP,
    oauth_provider             TEXT,
    oauth_id                   TEXT,
    suspended                  BOOLEAN NOT NULL DEFAULT false,
    terms_accepted             BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at          TIMESTAMP,
    terms_version              TEXT
  )`, 'users'],

  [`CREATE TABLE IF NOT EXISTS activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id),
    user_name   TEXT,
    feature     TEXT NOT NULL,
    stock       TEXT,
    created_at  TIMESTAMP DEFAULT now()
  )`, 'activity_logs'],

  [`CREATE TABLE IF NOT EXISTS contacts (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT DEFAULT 'General',
    message     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT now()
  )`, 'contacts'],

  [`CREATE TABLE IF NOT EXISTS community_posts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    stock           TEXT NOT NULL,
    content         TEXT NOT NULL,
    sentiment       TEXT DEFAULT 'neutral',
    user_name       TEXT,
    likes           INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT now(),
    category        TEXT DEFAULT 'stock',
    topic           TEXT,
    is_deleted      BOOLEAN DEFAULT false,
    updated_at      TIMESTAMP,
    repost_of_id    BIGINT,
    repost_comment  TEXT,
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    repost_count    INTEGER DEFAULT 0
  )`, 'community_posts'],

  [`CREATE TABLE IF NOT EXISTS post_comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL,
    user_id     UUID REFERENCES users(id),
    user_name   TEXT,
    content     TEXT NOT NULL,
    parent_id   BIGINT,
    is_deleted  BOOLEAN DEFAULT false,
    like_count  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP
  )`, 'post_comments'],

  [`CREATE TABLE IF NOT EXISTS post_likes (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL,
    user_id     UUID REFERENCES users(id) NOT NULL,
    created_at  TIMESTAMP DEFAULT now()
  )`, 'post_likes'],

  [`CREATE TABLE IF NOT EXISTS comment_likes (
    id          BIGSERIAL PRIMARY KEY,
    comment_id  BIGINT NOT NULL,
    user_id     UUID REFERENCES users(id) NOT NULL,
    created_at  TIMESTAMP DEFAULT now()
  )`, 'comment_likes'],

  [`CREATE TABLE IF NOT EXISTS journal_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id),
    stock       TEXT NOT NULL,
    action      TEXT NOT NULL,
    reason      TEXT NOT NULL,
    conviction  TEXT,
    created_at  TIMESTAMP DEFAULT now()
  )`, 'journal_entries'],

  [`CREATE TABLE IF NOT EXISTS feedbacks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name   TEXT,
    user_email  TEXT,
    category    TEXT NOT NULL DEFAULT 'General',
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'Open',
    admin_note  TEXT,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP
  )`, 'feedbacks'],

  [`CREATE TABLE IF NOT EXISTS pending_signups (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    investor_type TEXT DEFAULT 'Retail Investor',
    terms_version TEXT,
    token         TEXT NOT NULL UNIQUE,
    expires_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP DEFAULT now()
  )`, 'pending_signups'],

  [`CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    asset_name   TEXT NOT NULL,
    asset_type   TEXT NOT NULL,
    sub_category TEXT,
    action       TEXT NOT NULL,
    units        REAL NOT NULL,
    price        REAL NOT NULL,
    date         TIMESTAMP NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT now()
  )`, 'portfolio_transactions'],

  [`CREATE TABLE IF NOT EXISTS stock_universe (
    ticker              TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    exchange            TEXT NOT NULL DEFAULT 'NSE',
    sector              TEXT,
    industry            TEXT,
    market_cap          TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT now(),
    esg_e               INTEGER,
    esg_s               INTEGER,
    esg_g               INTEGER,
    esg_tier            TEXT,
    esg_risk            TEXT,
    brsr_mandated       BOOLEAN DEFAULT false,
    esg_notes           TEXT,
    esg_updated_at      TIMESTAMP,
    promoter_holding    REAL,
    promoter_pledge     REAL,
    bse_code            TEXT,
    shareholding_date   TEXT
  )`, 'stock_universe'],

  [`CREATE TABLE IF NOT EXISTS stock_metrics (
    ticker            TEXT PRIMARY KEY,
    price             TEXT,
    market_cap_cr     TEXT,
    pe                REAL,
    pb                REAL,
    ev_ebitda         REAL,
    roe               REAL,
    roce              REAL,
    npm               REAL,
    opm               REAL,
    debt_equity       REAL,
    current_ratio     REAL,
    interest_cov      REAL,
    revenue_growth    REAL,
    eps_growth        REAL,
    promoter_holding  REAL,
    promoter_pledge   REAL,
    dividend_yield    REAL,
    week_52_high      TEXT,
    week_52_low       TEXT,
    dv_score          INTEGER,
    raw_data          JSONB,
    fetched_at        TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT now()
  )`, 'stock_metrics'],

  [`CREATE TABLE IF NOT EXISTS user_screens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    columns     TEXT[],
    filters     JSONB,
    sort_by     TEXT DEFAULT 'name',
    sort_dir    TEXT DEFAULT 'asc',
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
  )`, 'user_screens'],
]

// ─────────────────────────────────────────────────────────────────
// STEP 2 — Add columns that may be missing from existing tables
// (ADD COLUMN IF NOT EXISTS is idempotent — safe to re-run)
// ─────────────────────────────────────────────────────────────────
const alterStatements = [
  // users — columns added after initial table creation
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified             BOOLEAN NOT NULL DEFAULT true`, 'users.email_verified'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token   TEXT`, 'users.email_verification_token'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expiry  TIMESTAMP`, 'users.email_verification_expiry'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled             BOOLEAN NOT NULL DEFAULT false`, 'users.two_fa_enabled'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_otp_hash            TEXT`, 'users.two_fa_otp_hash'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_otp_expiry          TIMESTAMP`, 'users.two_fa_otp_expiry'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider             TEXT`, 'users.oauth_provider'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id                   TEXT`, 'users.oauth_id'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended                  BOOLEAN NOT NULL DEFAULT false`, 'users.suspended'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted             BOOLEAN NOT NULL DEFAULT false`, 'users.terms_accepted'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at          TIMESTAMP`, 'users.terms_accepted_at'],
  [`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version              TEXT`, 'users.terms_version'],

  // community_posts — v2 columns
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category        TEXT DEFAULT 'stock'`, 'community_posts.category'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS topic           TEXT`, 'community_posts.topic'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_deleted      BOOLEAN DEFAULT false`, 'community_posts.is_deleted'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP`, 'community_posts.updated_at'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS repost_of_id   BIGINT`, 'community_posts.repost_of_id'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS repost_comment  TEXT`, 'community_posts.repost_comment'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS like_count      INTEGER DEFAULT 0`, 'community_posts.like_count'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count   INTEGER DEFAULT 0`, 'community_posts.comment_count'],
  [`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS repost_count    INTEGER DEFAULT 0`, 'community_posts.repost_count'],

  // post_comments — v2 columns
  [`ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_id   BIGINT`, 'post_comments.parent_id'],
  [`ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN DEFAULT false`, 'post_comments.is_deleted'],
  [`ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS like_count  INTEGER DEFAULT 0`, 'post_comments.like_count'],
  [`ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP`, 'post_comments.updated_at'],
]

async function run() {
  console.log('═══════════════════════════════════════')
  console.log(' DhanVeda DB migration')
  console.log('═══════════════════════════════════════\n')

  console.log('── Step 1: Create tables ──────────────')
  for (const [stmt, name] of createStatements) {
    try {
      await sql(stmt)
      console.log(`  ✓  ${name}`)
    } catch (err) {
      console.error(`  ✗  ${name}: ${err.message}`)
    }
  }

  console.log('\n── Step 2: Add missing columns ────────')
  for (const [stmt, col] of alterStatements) {
    try {
      await sql(stmt)
      console.log(`  ✓  ${col}`)
    } catch (err) {
      console.error(`  ✗  ${col}: ${err.message}`)
    }
  }

  // Step 3: Verify the critical tables have expected row counts
  console.log('\n── Step 3: Sanity check ───────────────')
  for (const table of ['users', 'activity_logs', 'portfolio_transactions']) {
    try {
      const rows = await sql(`SELECT COUNT(*) AS n FROM ${table}`)
      console.log(`  ✓  ${table}: ${rows[0].n} row(s)`)
    } catch (err) {
      console.error(`  ✗  ${table}: ${err.message}`)
    }
  }

  console.log('\n✅  Migration complete.')
}

run()
