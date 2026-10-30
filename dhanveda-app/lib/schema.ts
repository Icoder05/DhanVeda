import {
  pgTable,
  text,
  boolean,
  timestamp,
  bigserial,
  bigint,
  integer,
  uuid,
  real,
  jsonb,
} from 'drizzle-orm/pg-core'

// Version tag for ESG scoring algorithm — bump on each release update
export const ESG_SCORING_VERSION = 'v1.0-june2026'

// Version tag for Terms & Conditions — bump on each material legal-text update
export const TERMS_VERSION = 'v1.0-july2026'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').unique(),               // e.g. "srikrishna24" — unique handle
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),                          // null for OAuth-only accounts
  investorType: text('investor_type').default('Retail Investor'),
  isAdmin: boolean('is_admin').default(false),
  esgEnabled: boolean('esg_enabled').default(true),
  riskTolerance: text('risk_tolerance').default('Moderate'),
  investmentHorizon: text('investment_horizon').default('5+ years'),
  createdAt: timestamp('created_at').defaultNow(),
  // ── Email verification ────────────────────────────────────────────────────
  emailVerified: boolean('email_verified').notNull().default(true), // true for existing + OAuth users
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpiry: timestamp('email_verification_expiry'),
  // ── Two-factor authentication (optional, email OTP) ───────────────────────
  twoFaEnabled: boolean('two_fa_enabled').notNull().default(false),
  twoFaOtpHash: text('two_fa_otp_hash'),
  twoFaOtpExpiry: timestamp('two_fa_otp_expiry'),
  // ── OAuth provider linkage ────────────────────────────────────────────────
  oauthProvider: text('oauth_provider'),  // 'google' | 'microsoft-entra-id' | null
  oauthId: text('oauth_id'),
  suspended: boolean('suspended').notNull().default(false),
  // ── Terms & Conditions acceptance ──────────────────────────────────────────
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  termsVersion: text('terms_version'),
  // ── Usage tracking ────────────────────────────────────────────────────────
  tokensUsed: bigint('tokens_used', { mode: 'number' }).notNull().default(0),
})

export const communityPosts = pgTable('community_posts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  stock: text('stock').notNull(),
  content: text('content').notNull(),
  sentiment: text('sentiment').default('neutral'),
  userName: text('user_name'),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  // v2 community fields
  category: text('category').default('stock'),        // 'stock' | 'green' | 'venture'
  topic: text('topic'),                               // display topic (free-text)
  isDeleted: boolean('is_deleted').default(false),
  updatedAt: timestamp('updated_at'),
  repostOfId: bigint('repost_of_id', { mode: 'number' }),     // null = original
  repostComment: text('repost_comment'),              // quote when resharing
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  repostCount: integer('repost_count').default(0),
})

export const postComments = pgTable('post_comments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  postId: bigint('post_id', { mode: 'number' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  userName: text('user_name'),
  content: text('content').notNull(),
  parentId: bigint('parent_id', { mode: 'number' }),      // null = top-level
  isDeleted: boolean('is_deleted').default(false),
  likeCount: integer('like_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export const postLikes = pgTable('post_likes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  postId: bigint('post_id', { mode: 'number' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const commentLikes = pgTable('comment_likes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  commentId: bigint('comment_id', { mode: 'number' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const journalEntries = pgTable('journal_entries', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  stock: text('stock').notNull(),
  action: text('action').notNull(),
  reason: text('reason').notNull(),
  conviction: text('conviction'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const contacts = pgTable('contacts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').default('General'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const activityLogs = pgTable('activity_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  userName: text('user_name'),
  feature: text('feature').notNull(),
  stock: text('stock'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Screener: stock universe (master list) + ESG matrix ─────────────────────
export const stockUniverse = pgTable('stock_universe', {
  ticker:       text('ticker').primaryKey(),
  name:         text('name').notNull(),
  exchange:     text('exchange').notNull().default('NSE'),  // NSE | BSE | BOTH
  sector:       text('sector'),
  industry:     text('industry'),
  marketCap:    text('market_cap'),                         // Large | Mid | Small | Micro
  isActive:     boolean('is_active').default(true),
  createdAt:    timestamp('created_at').defaultNow(),
  // ── ESG Priority Matrix (computed from BSE data + sector algorithm) ──
  esgE:             integer('esg_e'),           // Environmental score 0-10
  esgS:             integer('esg_s'),           // Social score 0-10
  esgG:             integer('esg_g'),           // Governance score (BSE-pledge-adjusted)
  esgTier:          text('esg_tier'),           // A+ | A | B+ | B | C | D
  esgRisk:          text('esg_risk'),           // Very Low | Low | Medium | High | Very High
  brsrMandated:     boolean('brsr_mandated').default(false), // SEBI top-1000
  esgNotes:         text('esg_notes'),          // Context note (set per version)
  esgUpdatedAt:     timestamp('esg_updated_at'),
  instrumentType:   text('instrument_type').default('Equity').notNull(),
  // ── BSE Shareholding Data (source for G score computation) ──
  promoterHolding:  real('promoter_holding'),   // % total promoter holding (BSE)
  promoterPledge:   real('promoter_pledge'),    // % of promoter holding pledged (BSE)
  bseCode:          text('bse_code'),           // BSE scripcode for API lookup
  shareholdingDate: text('shareholding_date'),  // Quarter date of last BSE fetch
})

// ── Screener: cached financial metrics per stock (refreshed daily) ───────────
export const stockMetrics = pgTable('stock_metrics', {
  ticker:          text('ticker').primaryKey(),
  price:           text('price'),
  marketCapCr:     text('market_cap_cr'),
  pe:              real('pe'),
  pb:              real('pb'),
  evEbitda:        real('ev_ebitda'),
  roe:             real('roe'),
  roce:            real('roce'),
  npm:             real('npm'),
  opm:             real('opm'),
  debtEquity:      real('debt_equity'),
  currentRatio:    real('current_ratio'),
  interestCov:     real('interest_cov'),
  revenueGrowth:   real('revenue_growth'),
  epsGrowth:       real('eps_growth'),
  promoterHolding: real('promoter_holding'),
  promoterPledge:  real('promoter_pledge'),
  dividendYield:   real('dividend_yield'),
  week52High:      text('week_52_high'),
  week52Low:       text('week_52_low'),
  dvScore:         integer('dv_score'),
  rawData:         jsonb('raw_data'),
  fetchedAt:       timestamp('fetched_at'),
  updatedAt:       timestamp('updated_at').defaultNow(),
})

// ── Screener: user-saved custom screens (column sets + filters) ──────────────
export const userScreens = pgTable('user_screens', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description'),
  columns:     text('columns').array(),
  filters:     jsonb('filters'),
  sortBy:      text('sort_by').default('name'),
  sortDir:     text('sort_dir').default('asc'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
})

// ── User feedback / support tickets ─────────────────────────────────────────
export const feedbacks = pgTable('feedbacks', {
  id:          bigserial('id', { mode: 'number' }).primaryKey(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName:    text('user_name'),
  userEmail:   text('user_email'),
  category:    text('category').notNull().default('General'), // 'Bug' | 'Feature Request' | 'General'
  title:       text('title').notNull(),
  description: text('description').notNull(),
  status:      text('status').notNull().default('Open'),      // 'Open' | 'In Progress' | 'Resolved'
  adminNote:   text('admin_note'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at'),
})

// Temporary holding table for signups awaiting email verification.
// A user record in `users` is only created after the link is clicked.
export const pendingSignups = pgTable('pending_signups', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       text('user_id'),                           // chosen handle, stored until verified
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  investorType: text('investor_type').default('Retail Investor'),
  termsVersion: text('terms_version'),
  token:        text('token').notNull().unique(),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
})

// ── Portfolio: transaction ledger (persisted, all calculations client-side) ──────
export const portfolioTransactions = pgTable('portfolio_transactions', {
  id:          bigserial('id', { mode: 'number' }).primaryKey(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assetName:   text('asset_name').notNull(),
  assetType:   text('asset_type').notNull(),  // DIRECT EQUITY | MUTUAL FUNDS | ETF | DEBT MUTUAL FUNDS | FD | PPF | NSC | INSURANCE | GOLD - PHYSICAL | REAL ESTATE | BUSINESS FUNDS
  subCategory: text('sub_category'),          // optional (e.g. Large Cap, Equity Fund)
  action:      text('action').notNull(),      // Buy | Sell
  units:       real('units').notNull(),
  price:       real('price').notNull(),       // price per unit in ₹
  date:        timestamp('date').notNull(),
  notes:       text('notes'),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ── Admin: daily aggregated activity stats (archived from activity_logs) ────────
export const dailyStats = pgTable('daily_stats', {
  id:      bigserial('id', { mode: 'number' }).primaryKey(),
  date:    text('date').notNull(),       // 'YYYY-MM-DD'
  feature: text('feature').notNull(),
  stock:   text('stock'),
  count:   integer('count').notNull().default(0),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type CommunityPost = typeof communityPosts.$inferSelect
export type PostComment = typeof postComments.$inferSelect
export type JournalEntry = typeof journalEntries.$inferSelect
export type Contact = typeof contacts.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect
export type StockUniverse  = typeof stockUniverse.$inferSelect
export type StockMetrics = typeof stockMetrics.$inferSelect
export type UserScreen = typeof userScreens.$inferSelect
export type Feedback = typeof feedbacks.$inferSelect
export type PortfolioTransaction = typeof portfolioTransactions.$inferSelect
export type NewPortfolioTransaction = typeof portfolioTransactions.$inferInsert
