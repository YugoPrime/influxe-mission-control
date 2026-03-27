import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never block API routes or auth routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Bypass auth in dev mode
  if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  // Allow login page through
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Check for session token (both secure and non-secure variants)
  const token =
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('next-auth.session-token')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
