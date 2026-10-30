import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — NO database imports here (used by middleware)
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // jwt callback lives in auth.ts (needs DB for OAuth user lookup)
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).isAdmin = token.isAdmin
        ;(session.user as any).investorType = token.investorType
        ;(session.user as any).esgEnabled = token.esgEnabled
        ;(session.user as any).riskTolerance = token.riskTolerance
        ;(session.user as any).investmentHorizon = token.investmentHorizon
        ;(session.user as any).pending2FA = token.pending2FA ?? false
        ;(session.user as any).needsTermsAcceptance = token.needsTermsAcceptance ?? false
      }
      return session
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig
