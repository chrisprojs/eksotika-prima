import { NextResponse } from "next/server";

function redirectWWW(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  if (
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1")
  ) {
    return null;
  }

  if (hostname.startsWith("www.")) {
    url.hostname = hostname.replace("www.", "");
    return NextResponse.redirect(url, 301);
  }

  return null;
}

export function middleware(req) {
  const redirect = redirectWWW(req);
  if (redirect) return redirect;

  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const allowedOrigins = JSON.parse(
    process.env.ALLOWED_ORIGIN || "[]"
  );

  const origin = req.headers.get("origin");

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}