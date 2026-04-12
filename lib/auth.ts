import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'stroop_admin_session';
const SESSION_DURATION_SEC = 30 * 60; // 30 minutes

export interface AdminPayload {
  admin: true;
  iat: number;
}

export function signAdminToken(): string {
  return jwt.sign({ admin: true }, JWT_SECRET, {
    expiresIn: SESSION_DURATION_SEC,
  });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function setAdminCookie(token: string, response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_SEC,
    path: '/',
  });
  return response;
}

export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ valid: true } | NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  return { valid: true };
}
