import { env } from "@workspace/env/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { trpcServerClient } from "./trpc/server";

const { auth, signOut } = NextAuth(authConfig);
export default auth(async function middleware(request: NextRequest) {
  const { pathname,href } = request.nextUrl;

    // Only handle paths starting with /api/
    if (pathname.startsWith("/api/")) {
      const baseUrl =
        env.NODE_ENV !== "development"
          ? (env.API_URL ?? "https://localhost:5000")
          : "http://localhost:5000";
  
      const url = new URL(
        request.nextUrl.href.replace(request.nextUrl.origin, ""),
        baseUrl,
      );
      return NextResponse.rewrite(url);
    }


    if (pathname.startsWith("/s3proxy/")) {
      const proxyUrl = href.split("/s3proxy/")[1]!;
      const url = new URL(proxyUrl);
      return NextResponse.rewrite(url);
    }


  const privatePages = ["/studio", "/profile", "/playlist", "/history", "/likes"];
  // if (pathname === '/logout') {
  //   await signOut({
  //     redirect: false,
  //   })
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/";
  //   return NextResponse.redirect(url);
  // }

  // Ensure private pages are only accessible if the user is logged in
  const session = await auth();
  // console.log(
  //   session,
  //   privatePages.some(page => pathname.startsWith(page)),
  //   pathname,
  //   "waesrdghfdaswdfgdesawedfghfdeaswdgfdesfv",
  // );

  if (!session && privatePages.some(page => pathname.startsWith(page))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (session && pathname.startsWith("/studio/")) {
    const user = await trpcServerClient.user.getMe.query();
    if (!user.channel_id) {
      const url = request.nextUrl.clone();
      url.pathname = "/studio";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/:path*", "/studio/:path*", "/profile", "/playlist", '/logout',  "/history", "/likes", "/s3proxy/:path*"],
};
