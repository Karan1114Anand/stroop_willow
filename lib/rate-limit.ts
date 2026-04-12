import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

function cleanupExpired() {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

function rateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number
): NextResponse | null {
  cleanupExpired();

  const identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const key = `${identifier}:${req.nextUrl.pathname}`;
  const now = Date.now();

  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return null;
  }

  if (store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return null;
  }

  store[key].count++;

  if (store[key].count > limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  return null;
}

// Auth endpoints: 5 requests per 15 minutes
export function authRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, 5, 15 * 60 * 1000);
}

// Data export: 5 requests per minute
export function dataExportRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, 5, 60 * 1000);
}

// General API: 60 requests per minute
export function apiRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, 60, 60 * 1000);
}
