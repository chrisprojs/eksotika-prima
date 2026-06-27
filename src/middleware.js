import { NextResponse } from "next/server";

export function middleware(req) {
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
  matcher: ["/api/:path*"],
};
