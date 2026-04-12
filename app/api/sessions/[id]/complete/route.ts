import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface CompleteBody {
  mean_rt_block1?: number | null;
  mean_rt_block2?: number | null;
  mean_rt_block3?: number | null;
  overall_mean_rt?: number | null;
  time_constraint_ms?: number | null;
  accuracy_block1?: number | null;
  accuracy_block2?: number | null;
  accuracy_block3?: number | null;
  missed_count_block3?: number | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CompleteBody = await req.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    // Validate metrics
    const validateMetric = (value: number | null | undefined, name: string) => {
      if (value !== null && value !== undefined) {
        if (typeof value !== 'number' || value < 0 || value > 100000) {
          throw new Error(`Invalid ${name}`);
        }
      }
    };

    validateMetric(body.mean_rt_block1, 'mean_rt_block1');
    validateMetric(body.mean_rt_block2, 'mean_rt_block2');
    validateMetric(body.mean_rt_block3, 'mean_rt_block3');
    validateMetric(body.overall_mean_rt, 'overall_mean_rt');
    validateMetric(body.time_constraint_ms, 'time_constraint_ms');

    if (body.accuracy_block1 !== null && body.accuracy_block1 !== undefined) {
      if (body.accuracy_block1 < 0 || body.accuracy_block1 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block1' }, { status: 400 });
      }
    }
    if (body.accuracy_block2 !== null && body.accuracy_block2 !== undefined) {
      if (body.accuracy_block2 < 0 || body.accuracy_block2 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block2' }, { status: 400 });
      }
    }
    if (body.accuracy_block3 !== null && body.accuracy_block3 !== undefined) {
      if (body.accuracy_block3 < 0 || body.accuracy_block3 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block3' }, { status: 400 });
      }
    }
    if (body.missed_count_block3 !== null && body.missed_count_block3 !== undefined) {
      if (body.missed_count_block3 < 0 || body.missed_count_block3 > 20) {
        return NextResponse.json({ error: 'Invalid missed_count_block3' }, { status: 400 });
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    // Validate metrics
    const validateMetric = (value: number | null | undefined, name: string) => {
      if (value !== null && value !== undefined) {
        if (typeof value !== 'number' || value < 0 || value > 100000) {
          throw new Error(`Invalid ${name}`);
        }
      }
    };

    validateMetric(body.mean_rt_block1, 'mean_rt_block1');
    validateMetric(body.mean_rt_block2, 'mean_rt_block2');
    validateMetric(body.mean_rt_block3, 'mean_rt_block3');
    validateMetric(body.overall_mean_rt, 'overall_mean_rt');
    validateMetric(body.time_constraint_ms, 'time_constraint_ms');

    if (body.accuracy_block1 !== null && body.accuracy_block1 !== undefined) {
      if (body.accuracy_block1 < 0 || body.accuracy_block1 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block1' }, { status: 400 });
      }
    }
    if (body.accuracy_block2 !== null && body.accuracy_block2 !== undefined) {
      if (body.accuracy_block2 < 0 || body.accuracy_block2 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block2' }, { status: 400 });
      }
    }
    if (body.accuracy_block3 !== null && body.accuracy_block3 !== undefined) {
      if (body.accuracy_block3 < 0 || body.accuracy_block3 > 100) {
        return NextResponse.json({ error: 'Invalid accuracy_block3' }, { status: 400 });
      }
    }
    if (body.missed_count_block3 !== null && body.missed_count_block3 !== undefined) {
      if (body.missed_count_block3 < 0 || body.missed_count_block3 > 20) {
        return NextResponse.json({ error: 'Invalid missed_count_block3' }, { status: 400 });
      }
    }

    const session = await prisma.session.update({
      where: { session_id: id },
      data: {
        completed_at: new Date(),
        mean_rt_block1: body.mean_rt_block1 ?? null,
        mean_rt_block2: body.mean_rt_block2 ?? null,
        mean_rt_block3: body.mean_rt_block3 ?? null,
        overall_mean_rt: body.overall_mean_rt ?? null,
        time_constraint_ms: body.time_constraint_ms ?? null,
        accuracy_block1: body.accuracy_block1 ?? null,
        accuracy_block2: body.accuracy_block2 ?? null,
        accuracy_block3: body.accuracy_block3 ?? null,
        missed_count_block3: body.missed_count_block3 ?? null,
      },
    });

    return NextResponse.json({ ok: true, session_id: session.session_id });
  } catch (err) {
    console.error('PATCH /api/sessions/[id]/complete error:', err);
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}
