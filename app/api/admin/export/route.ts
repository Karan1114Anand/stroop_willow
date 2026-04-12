import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dataExportRateLimit } from '@/lib/rate-limit';
import { dataExportRateLimit } from '@/lib/rate-limit';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(row: unknown[]): string {
  return row.map(escapeCSV).join(',');
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  // Apply rate limiting
  const rateLimitResponse = dataExportRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Apply rate limiting
  const rateLimitResponse = dataExportRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

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
      include: { trials: { orderBy: [{ block_number: 'asc' }, { trial_number: 'asc' }] } },
      orderBy: { started_at: 'asc' },
    });

    if (sessions.length === 0) {
      return new NextResponse('No data found for the selected date range.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const lines: string[] = [];

    // ---- SECTION 1: Trial-level data ----
    lines.push('SECTION 1: Trial-Level Data');
    lines.push(
      rowToCSV([
        'session_id',
        'participant_id',
        'started_at',
        'block_number',
        'block_type',
        'trial_number',
        'word_shown',
        'ink_color',
        'user_response',
        'outcome',
        'reaction_time_ms',
        'created_at',
      ])
    );

    for (const session of sessions) {
      for (const trial of session.trials) {
        lines.push(
          rowToCSV([
            session.session_id,
            session.participant_id,
            session.started_at.toISOString(),
            trial.block_number,
            trial.block_type,
            trial.trial_number,
            trial.word_shown,
            trial.ink_color,
            trial.user_response,
            trial.outcome,
            trial.reaction_time_ms,
            trial.created_at.toISOString(),
          ])
        );
      }
    }

    lines.push('');
    lines.push('');

    // ---- SECTION 2: Per-participant summary stats ----
    lines.push('SECTION 2: Per-Participant Summary Statistics');
    lines.push(
      rowToCSV([
        'session_id',
        'participant_id',
        'started_at',
        'completed_at',
        'mean_RT_block1',
        'mean_RT_block2',
        'mean_RT_block3',
        'overall_mean_RT',
        'reaction_speed_block1',
        'reaction_speed_block2',
        'reaction_speed_block3',
        'time_constraint_used_ms',
        'accuracy_block1_%',
        'accuracy_block2_%',
        'accuracy_block3_%',
        'missed_count_block3',
      ])
    );

    for (const session of sessions) {
      lines.push(
        rowToCSV([
          session.session_id,
          session.participant_id,
          session.started_at.toISOString(),
          session.completed_at?.toISOString() ?? '',
          session.mean_rt_block1?.toFixed(2) ?? '',
          session.mean_rt_block2?.toFixed(2) ?? '',
          session.mean_rt_block3?.toFixed(2) ?? '',
          session.overall_mean_rt?.toFixed(2) ?? '',
          session.mean_rt_block1 ? (1 / session.mean_rt_block1).toFixed(6) : '',
          session.mean_rt_block2 ? (1 / session.mean_rt_block2).toFixed(6) : '',
          session.mean_rt_block3 ? (1 / session.mean_rt_block3).toFixed(6) : '',
          session.time_constraint_ms?.toFixed(2) ?? '',
          session.accuracy_block1?.toFixed(2) ?? '',
          session.accuracy_block2?.toFixed(2) ?? '',
          session.accuracy_block3?.toFixed(2) ?? '',
          session.missed_count_block3 ?? '',
        ])
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const filename = `stroop_data_${today}.csv`;
    const csvContent = lines.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET /api/admin/export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
