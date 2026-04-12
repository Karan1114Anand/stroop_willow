import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface TrialPayload {
  session_id: string;
  participant_id: string;
  block_number: number;
  block_type: string;
  trial_number: number;
  word_shown: string;
  ink_color: string;
  user_response: string | null;
  outcome: string;
  reaction_time_ms: number | null;
}

interface RequestBody {
  trials: TrialPayload[];
  block_summary?: {
    mean_rt?: number | null;
    accuracy?: number | null;
    missed_count?: number | null;
    time_constraint_ms?: number | null;
    block_number: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { trials, block_summary } = body;

    // Validation
    if (!trials || !Array.isArray(trials) || trials.length === 0) {
      return NextResponse.json({ error: 'No trials provided' }, { status: 400 });
    }

    if (trials.length > 100) {
      return NextResponse.json({ error: 'Too many trials in single request' }, { status: 400 });
    }

    const sessionId = trials[0].session_id;
    const participantId = trials[0].participant_id;

    if (!sessionId || !participantId) {
      return NextResponse.json({ error: 'Missing session_id or participant_id' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(participantId)) {
      return NextResponse.json({ error: 'Invalid session_id or participant_id format' }, { status: 400 });
    }

    // Validate trial data
    for (const trial of trials) {
      if (trial.block_number < 1 || trial.block_number > 3) {
        return NextResponse.json({ error: 'Invalid block_number' }, { status: 400 });
      }
      if (trial.trial_number < 1 || trial.trial_number > 20) {
        return NextResponse.json({ error: 'Invalid trial_number' }, { status: 400 });
      }
      if (!['RED', 'BLUE', 'GREEN', 'YELLOW'].includes(trial.word_shown)) {
        return NextResponse.json({ error: 'Invalid word_shown' }, { status: 400 });
      }
      if (!['RED', 'BLUE', 'GREEN', 'YELLOW'].includes(trial.ink_color)) {
        return NextResponse.json({ error: 'Invalid ink_color' }, { status: 400 });
      }
      if (trial.user_response && !['RED', 'BLUE', 'GREEN', 'YELLOW'].includes(trial.user_response)) {
        return NextResponse.json({ error: 'Invalid user_response' }, { status: 400 });
      }
      if (!['correct', 'wrong', 'missed'].includes(trial.outcome)) {
        return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });
      }
      if (trial.reaction_time_ms !== null && (trial.reaction_time_ms < 0 || trial.reaction_time_ms > 60000)) {
        return NextResponse.json({ error: 'Invalid reaction_time_ms' }, { status: 400 });
      }
    }

    // Bulk insert trials
    await prisma.trial.createMany({
      data: trials.map((t) => ({
        session_id: t.session_id,
        participant_id: t.participant_id,
        block_number: t.block_number,
        block_type: t.block_type,
        trial_number: t.trial_number,
        word_shown: t.word_shown,
        ink_color: t.ink_color,
        user_response: t.user_response ?? null,
        outcome: t.outcome,
        reaction_time_ms: t.reaction_time_ms ?? null,
      })),
    });

    // Update session metrics incrementally per block
    if (block_summary) {
      const { block_number, mean_rt, accuracy, missed_count, time_constraint_ms } = block_summary;
      const updateData: Record<string, unknown> = {};
      if (block_number === 1) {
        updateData.mean_rt_block1 = mean_rt ?? null;
        updateData.accuracy_block1 = accuracy ?? null;
      } else if (block_number === 2) {
        updateData.mean_rt_block2 = mean_rt ?? null;
        updateData.accuracy_block2 = accuracy ?? null;
        if (time_constraint_ms !== undefined) updateData.time_constraint_ms = time_constraint_ms;
      } else if (block_number === 3) {
        updateData.mean_rt_block3 = mean_rt ?? null;
        updateData.accuracy_block3 = accuracy ?? null;
        updateData.missed_count_block3 = missed_count ?? null;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.session.update({
          where: { session_id: sessionId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ ok: true, saved: trials.length });
  } catch (err) {
    console.error('POST /api/trials error:', err);
    return NextResponse.json({ error: 'Failed to save trials' }, { status: 500 });
  }
}
