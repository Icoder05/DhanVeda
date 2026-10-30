import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const pending2FA = !!(req.auth?.user as any)?.pending2FA

  // ── 2FA pending state: allow only /verify-otp ─────────────────────────────
  if (isLoggedIn && pending2FA) {
    if (!pathname.startsWith('/verify-otp')) {
      return NextResponse.redirect(new URL('/verify-otp', req.nextUrl))
    }
    return NextResponse.next()
  }

  // Fully logged in users shouldn't revisit the OTP page
  if (isLoggedIn && pathname === '/verify-otp') {
    return NextResponse.redirect(new URL('/research', req.nextUrl))
  }

  // ── First-time OAuth users: must accept Terms before reaching the app ─────
  const needsTerms = !!(req.auth?.user as any)?.needsTermsAcceptance
  if (isLoggedIn && needsTerms && !pending2FA) {
    if (!pathname.startsWith('/accept-terms')) {
      return NextResponse.redirect(new URL('/accept-terms', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (isLoggedIn && !needsTerms && pathname === '/accept-terms') {
    return NextResponse.redirect(new URL('/research', req.nextUrl))
  }

  // Authenticated users visiting auth or landing pages → dashboard
  if (isLoggedIn && !pending2FA && !needsTerms) {
    if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/home', req.nextUrl))
    }
  }

  const protectedPrefixes = ['/home', '/venture', '/research', '/decide', '/green', '/money', '/settings']
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
