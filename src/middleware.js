import { NextResponse } from "next/server";

const configuredCanonicalSiteUrl = process.env.NEXT_PUBLIC_URL;

function getAllowedOrigins() {
  try {
    return JSON.parse(process.env.ALLOWED_ORIGIN || "[]");
  } catch {
    return [];
  }
}

function isLocalHost(hostname) {
  return ["localhost", "127.0.0.1"].includes(hostname);
}

function getConfiguredCanonicalUrl() {
  if (!configuredCanonicalSiteUrl) {
    return null;
  }

  const canonicalUrl = new URL(configuredCanonicalSiteUrl);

  if (isLocalHost(canonicalUrl.hostname)) {
    return null;
  }

  return canonicalUrl;
}

function getCanonicalRedirect(req) {
  const requestHost = req.headers.get("host")?.toLowerCase();

  if (!requestHost) {
    return null;
  }

  const requestProtocol = (
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "")
  ).split(",")[0];
  const configuredCanonicalUrl = getConfiguredCanonicalUrl();
  const targetProtocol = configuredCanonicalUrl?.protocol.replace(":", "") || "https";
  const targetHost = configuredCanonicalUrl?.host.toLowerCase() ||
    requestHost.replace(/^www\./, "");

  if (
    requestHost === targetHost &&
    (isLocalHost(requestHost.split(":")[0]) || requestProtocol === targetProtocol)
  ) {
    return null;
  }

  return new URL(
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
    `${targetProtocol}://${targetHost}`
  );
}

export function middleware(req) {
  const canonicalRedirect = getCanonicalRedirect(req);

  if (canonicalRedirect) {
    return NextResponse.redirect(canonicalRedirect, 301);
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.get("origin");

    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse("Bad Request", { status: 400 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
