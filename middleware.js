import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check for Firebase session cookie (set by Firebase App Hosting / custom sessions)
  // Firebase Web SDK stores auth in IndexedDB (client-side only), so we check for
  // a simple session marker cookie that we set on login (see AuthContext)
  const sessionCookie =
    request.cookies.get("__session")?.value ||
    request.cookies.get("bixit_session")?.value;

  const protectedPrefixes = ["/client", "/worker", "/booking", "/review", "/payment-success", "/admin"];
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client/:path*",
    "/worker/:path*",
    "/booking/:path*",
    "/review/:path*",
    "/payment-success/:path*",
    "/admin/:path*",
  ],
};
