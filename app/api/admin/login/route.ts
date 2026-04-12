import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken, setAdminCookie } from '@/lib/auth';
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = authRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      );
    }

    const usernameMatch = username === adminUsername;
    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    console.log('[admin/login] usernameMatch:', usernameMatch, '| passwordMatch:', passwordMatch);
    console.log('[admin/login] hash from env:', adminPasswordHash?.slice(0, 10), '...');

    if (!usernameMatch || !passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signAdminToken();
    const response = NextResponse.json({ ok: true });
    return setAdminCookie(token, response);
  } catch (err) {
    console.error('POST /api/admin/login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
