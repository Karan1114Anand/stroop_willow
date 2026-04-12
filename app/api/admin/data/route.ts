import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const where: {
      started_at?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (startDate || endDate) {
      where.started_at = {};
      if (startDate) where.started_at.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.started_at.lte = end;
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { started_at: 'desc' },
      select: {
        session_id: true,
        participant_id: true,
        started_at: true,
        completed_at: true,
        mean_rt_block1: true,
        mean_rt_block2: true,
        mean_rt_block3: true,
        overall_mean_rt: true,
        time_constraint_ms: true,
        accuracy_block1: true,
        accuracy_block2: true,
        accuracy_block3: true,
        missed_count_block3: true,
      },
    });

    const count = sessions.length;
    const earliestDate = sessions.length > 0 ? sessions[sessions.length - 1].started_at : null;
    const latestDate = sessions.length > 0 ? sessions[0].started_at : null;

    return NextResponse.json({ sessions, count, earliestDate, latestDate });
  } catch (err) {
    console.error('GET /api/admin/data error:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
