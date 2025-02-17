import { env } from '@workspace/env/next'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'





const { auth } = NextAuth(authConfig)
export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const privatePages = ['/studio', '/profile']

  // Ensure private pages are only accessible if the user is logged in
  const session = await auth();
  if (!session && privatePages.some(page => pathname.startsWith(page))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Only handle paths starting with /api/
  if (pathname.startsWith('/api/')) {
    const baseUrl = env.NODE_ENV !== "development" 
      ? (env.API_URL ?? "https://localhost:5000")
      : "http://localhost:5000"

    const url = new URL(request.nextUrl.href.replace(request.nextUrl.origin, ''), baseUrl)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
})

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/api/:path*', "/studio/:path*", "/profile"],
}