import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const participantId = uuidv4();
    const sessionId = uuidv4();

    const session = await prisma.session.create({
      data: {
        session_id: sessionId,
        participant_id: participantId,
      },
    });

    return NextResponse.json({
      session_id: session.session_id,
      participant_id: session.participant_id,
    });
  } catch (err) {
    console.error('POST /api/sessions error:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
