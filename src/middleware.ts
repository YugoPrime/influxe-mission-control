import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Bypass auth in dev mode or when BYPASS_AUTH is set
  if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }
  
  // Check for session token
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token')
  
  if (!token && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
