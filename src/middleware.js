import { NextResponse } from "next/server";

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
  const corsResponse = cors(req);
  if (corsResponse) {
    return corsResponse;
  }

  const rateLimiterResponse = await rateLimiter(req);
  if (rateLimiterResponse) {
    return rateLimiterResponse;
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*"
}