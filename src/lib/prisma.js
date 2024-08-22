import { PrismaClient } from "@prisma/client";
import Cors from 'cors';
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_DATABASE_URL
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

const allowedOrigins = ['http://localhost:3000'];

// Initialize CORS middleware
const cors = Cors((req, callback) => {
  const corsOptions = { methods: ['GET', 'POST', 'PUT', 'DELETE'] };
  if (allowedOrigins.includes(req.headers.origin) && !req.url.startsWith('/api')) {
    corsOptions.origin = true; // Reflect the request origin
  } else {
    corsOptions.origin = false; // Disallow the request
  }
  callback(null, corsOptions); // Callback expects two parameters: error and options
});

const rateLimiter = new Ratelimit({
  redis: kv, // Use @vercel/kv as the storage backend
  limiter: Ratelimit.fixedWindow(100, "15 m"),
});

export function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export async function applyMiddlewares(req) {
  try {
    await runMiddleware(req, new Response(), cors);
    await runMiddleware(req, new Response(), rateLimiter);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error applying middlewares' }), { status: 500 });
  }
}

export default prisma