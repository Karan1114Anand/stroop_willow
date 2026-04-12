import { NextRequest, NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  return clearAdminCookie(response);
}
