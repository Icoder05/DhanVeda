import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/lib/auth.config'
import { generateOTP, signBypassToken, verifyBypassToken } from '@/lib/auth-utils'
import { send2FAOtpEmail } from '@/lib/email'

// Only registers the provider if real credentials are set (not placeholder strings)
function isConfigured(val?: string) {
  return !!val && !val.startsWith('your_')
}

const oauthProviders = [
  ...(isConfigured(process.env.GOOGLE_CLIENT_ID) ? [Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  })] : []),
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...oauthProviders,
    Credentials({
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        email:  { label: 'Email',   type: 'email' },  // kept for admin login
        password:    { label: 'Password',     type: 'password' },
        bypassToken: { label: 'Bypass Token', type: 'text' },
      },
      async authorize(credentials) {
        const uid = (credentials?.userId as string | undefined)?.toLowerCase().trim()
        const em  = (credentials?.email  as string | undefined)?.toLowerCase().trim()
        if (!uid && !em) return null

        const [user] = uid
          ? await db.select().from(users).where(eq(users.userId, uid)).limit(1)
          : await db.select().from(users).where(eq(users.email,  em!)).limit(1)

        if (!user) return null

        // ── 2FA bypass path (client calls this after OTP verified) ────────────
        if (credentials?.bypassToken) {
          if (!verifyBypassToken(credentials.bypassToken as string, user.id)) return null
          // Clear the OTP so the bypass token can only be used once
          await db.update(users).set({ twoFaOtpHash: null, twoFaOtpExpiry: null }).where(eq(users.id, user.id))
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            investorType: user.investorType,
            esgEnabled: user.esgEnabled,
            riskTolerance: user.riskTolerance,
            investmentHorizon: user.investmentHorizon,
            needs2FA: false,
          }
        }

        // ── Normal credentials path ────────────────────────────────────────────
        if (!credentials?.password || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        if (user.suspended) {
          throw new Error('account_suspended')
        }

        if (!user.emailVerified) {
          throw new Error('email_not_verified')
        }

        // ── 2FA challenge ──────────────────────────────────────────────────────
        if (user.twoFaEnabled) {
          const otp = generateOTP()
          const [hash] = await Promise.all([
            bcrypt.hash(otp, 6),
          ])
          const expiry = new Date(Date.now() + 10 * 60 * 1000)

          // Save OTP and send email in parallel
          await Promise.all([
            db.update(users).set({ twoFaOtpHash: hash, twoFaOtpExpiry: expiry }).where(eq(users.id, user.id)),
            send2FAOtpEmail(user.email, user.name, otp),
          ])

          // Return user with pending flag — middleware gates them to /verify-otp
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            investorType: user.investorType,
            esgEnabled: user.esgEnabled,
            riskTolerance: user.riskTolerance,
            investmentHorizon: user.investmentHorizon,
            needs2FA: true,
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          investorType: user.investorType,
          esgEnabled: user.esgEnabled,
          riskTolerance: user.riskTolerance,
          investmentHorizon: user.investmentHorizon,
        }
      },
    }),
  ],
  callbacks: {
    // Extends session callback from authConfig; adds jwt + signIn for OAuth
    ...authConfig.callbacks,

    // JWT callback needs DB access for OAuth users → lives here, not in auth.config.ts
    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.type === 'oauth') {
          // OAuth user: atomic UPSERT guarantees we always get the correct DB row in one
          // round-trip regardless of race conditions between signIn and jwt callbacks.
          const normalizedEmail = user.email!.toLowerCase().trim()
          const [dbUser] = await db
            .insert(users)
            .values({
              name: user.name ?? 'User',
              email: normalizedEmail,
              emailVerified: true,
              oauthProvider: account.provider,
              oauthId: account.providerAccountId,
            })
            .onConflictDoUpdate({
              target: users.email,
              set: {
                // Keep the row linked to this OAuth provider; never overwrite user's custom name
                oauthProvider: account.provider,
                oauthId: account.providerAccountId,
                emailVerified: true,
              },
            })
            .returning()
          token.id = dbUser.id
          token.isAdmin = dbUser.isAdmin
          token.investorType = dbUser.investorType
          token.esgEnabled = dbUser.esgEnabled
          token.riskTolerance = dbUser.riskTolerance
          token.investmentHorizon = dbUser.investmentHorizon
          token.pending2FA = false // OAuth bypasses 2FA
          token.needsTermsAcceptance = !dbUser.termsAccepted
        } else {
          // Credentials login: user object comes from authorize() with all fields
          token.id = user.id
          token.isAdmin = (user as any).isAdmin
          token.investorType = (user as any).investorType
          token.esgEnabled = (user as any).esgEnabled
          token.riskTolerance = (user as any).riskTolerance
          token.investmentHorizon = (user as any).investmentHorizon
          token.pending2FA = (user as any).needs2FA ?? false
          token.needsTermsAcceptance = false // credentials signups accept terms inline in /api/signup
        }
      } else if (trigger === 'update' || !UUID_RE.test(token.id as string)) {
        // Self-heal: re-fetch from DB when:
        //   1. Client called update() (e.g., after accepting terms) — refreshes needsTermsAcceptance
        //   2. token.id is missing or not a valid UUID (stale JWT from before OAuth fix)
        if (token.email) {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, (token.email as string).toLowerCase().trim()))
            .limit(1)
          if (dbUser) {
            token.id = dbUser.id
            token.isAdmin = dbUser.isAdmin
            token.investorType = dbUser.investorType
            token.esgEnabled = dbUser.esgEnabled
            token.riskTolerance = dbUser.riskTolerance
            token.investmentHorizon = dbUser.investmentHorizon
            token.pending2FA = token.pending2FA ?? false
            token.needsTermsAcceptance = !dbUser.termsAccepted
          }
        }
      }
      return token
    },

    // Handles OAuth account sign-in: gate that runs before jwt.
    // User creation/linking is handled atomically in the jwt callback via UPSERT.
    async signIn({ user, account }) {
      if (account?.type !== 'oauth') return true
      if (!user.email) return false
      return true
    },
  },
})
