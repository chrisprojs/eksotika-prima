import { NextResponse } from "next/server";

export function middleware(req) {
  const requestHeaders = new Headers(req.headers);
  const pathname = req.nextUrl.pathname;
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "id";

  requestHeaders.set("x-site-locale", locale);

  if (pathname.startsWith("/api/")) {
    const allowedOrigins = JSON.parse(
      process.env.ALLOWED_ORIGIN || "[]"
    );

    const origin = req.headers.get("origin");

    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse("Bad Request", { status: 400 });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|asset).*)"],
};
