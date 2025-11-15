import { NextResponse } from "next/server";

function redirectWWW(req) {
  // Handle www to non-www redirect (or vice versa)
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Skip redirect for localhost and development environments
  if (
    hostname === 'localhost' ||
    hostname.includes('localhost:') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('0.0.0.0')
  ) {
    return null;
  }

  // Check if the request is for www version
  if (hostname.startsWith('www.')) {
    // Redirect www to non-www
    url.hostname = hostname.replace('www.', '');
    return NextResponse.redirect(url, 301); // 301 = Permanent Redirect
  }

  // Optional: If you want to redirect non-www to www instead, uncomment below:
  // if (!hostname.startsWith('www.')) {
  //   url.hostname = `www.${hostname}`;
  //   return NextResponse.redirect(url, 301);
  // }

  return null;
}

function cors(req){
  // Make cors as functional component
  const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGIN);
  const origin = req.headers.get('origin');

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 400,
      statusText: 'Bad Request',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

const rateLimitStore = {};

async function rateLimiter(req) {
  // Make rateLimiter as a functional component
  const clientIP = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const currentTime = Date.now();

  const requestLimit = 100; // Max number of requests
  const timeWindow = 60 * 1000; // Time window in milliseconds (e.g., 1 minute)

  if (!rateLimitStore[clientIP]) {
    rateLimitStore[clientIP] = {
      count: 1,
      startTime: currentTime,
    };
  } else {
    rateLimitStore[clientIP].count += 1;
  }

  const elapsedTime = currentTime - rateLimitStore[clientIP].startTime;

  if (elapsedTime > timeWindow) {
    // Reset rate limiting after the time window has passed
    rateLimitStore[clientIP] = {
      count: 1,
      startTime: currentTime,
    };
  } else if (rateLimitStore[clientIP].count > requestLimit) {
    return new NextResponse(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': Math.ceil((timeWindow - elapsedTime) / 1000), // Retry-After in seconds
      },
    });
  }
}

export async function middleware(req){
  // Handle www/non-www redirect first (for all requests)
  const wwwRedirect = redirectWWW(req);
  if (wwwRedirect) {
    return wwwRedirect;
  }

  // CORS and rate limiting only for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const corsResponse = cors(req);
    if (corsResponse) {
      return corsResponse;
    }

    const rateLimiterResponse = await rateLimiter(req);
    if (rateLimiterResponse) {
      return rateLimiterResponse;
    }
  }

  return NextResponse.next()
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