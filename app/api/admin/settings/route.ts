import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  try {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          time_reduction_ms: 120,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('GET /api/admin/settings error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  try {
    const body = await req.json();
    const { time_reduction_ms } = body;

    // Validation
    if (typeof time_reduction_ms !== 'number') {
      return NextResponse.json(
        { error: 'time_reduction_ms must be a number' },
        { status: 400 }
      );
    }

    if (time_reduction_ms < 0 || time_reduction_ms > 5000) {
      return NextResponse.json(
        { error: 'time_reduction_ms must be between 0 and 5000' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          time_reduction_ms,
          updated_by: 'admin',
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          time_reduction_ms,
          updated_by: 'admin',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('PATCH /api/admin/settings error:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
