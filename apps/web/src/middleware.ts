import { env } from '@workspace/env/next'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'



export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle paths starting with /api/
  if (pathname.startsWith('/api/')) {
    // console.log('API request:', request.nextUrl.href);
    
    const baseUrl = env.NODE_ENV !== "development" 
      ? (env.API_URL ?? "https://localhost:5000")
      : "http://localhost:5000"

      
      const url = new URL(request.nextUrl.href.replace(request.nextUrl.origin, ''), baseUrl)
    //   console.log('Non-API request:', );
      console.log('API request:', request.nextUrl.href, baseUrl, url);
    return NextResponse.rewrite(url)
  }

  

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: '/api/:path*'
}