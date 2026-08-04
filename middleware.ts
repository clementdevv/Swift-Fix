import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

export default NextAuth(authConfig).auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const isLoggedIn = !!req.auth

  const protectedPrefixes = [
    '/dashboard',
    '/client',
    '/provider',
    '/admin',
    '/find_services',
    '/my_bookings',
    '/reviews_and_ratings',
    '/notifications',
    '/settings',
  ]

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn) return NextResponse.next()

  const userRole = req.auth?.user?.userType ?? 'customer'
  const isOnboarded = req.auth?.user?.onboardingCompleted ?? false

  const authPages = ['/login', '/signup', '/forgot-password']
  if (authPages.some((p) => pathname.startsWith(p))) {
    if (userRole === 'provider') {
      return NextResponse.redirect(
        new URL(isOnboarded ? '/dashboard/service_provider' : '/onboarding/provider', nextUrl)
      )
    }
    return NextResponse.redirect(new URL('/dashboard/client', nextUrl))
  }

  if (pathname.startsWith('/admin') && userRole !== 'customer') {
    // no admin role yet — adjust when you add ADMIN enum
  }

  if (
    (pathname.startsWith('/provider') || pathname.startsWith('/dashboard/service_provider')) &&
    userRole !== 'provider'
  ) {
    return NextResponse.redirect(new URL('/dashboard/client', nextUrl))
  }

  const clientRoutes = [
    '/client',
    '/dashboard/client',
    '/find_services',
    '/my_bookings',
    '/reviews_and_ratings',
    '/notifications',
    '/settings',
  ]
  if (clientRoutes.some((p) => pathname.startsWith(p)) && userRole !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard/service_provider', nextUrl))
  }

  if (pathname === '/dashboard' || pathname === '/') {
    if (userRole === 'provider') {
      return NextResponse.redirect(new URL('/dashboard/service_provider', nextUrl))
    }
    if (userRole === 'customer') {
      return NextResponse.redirect(new URL('/dashboard/client', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
