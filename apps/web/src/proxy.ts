import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname === '/sign-in' ||
    pathname === '/sign-up'
  ) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up).)*',
    '/profile/:path*'
  ]
}
