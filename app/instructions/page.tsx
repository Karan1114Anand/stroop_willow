'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructionsPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string>('');

  useEffect(() => {
    const pid = sessionStorage.getItem('stroop_participant_id');
    const sid = sessionStorage.getItem('stroop_session_id');
    if (!pid || !sid) {
      router.replace('/');
      return;
    }
    setParticipantId(pid);
  }, [router]);

  return (
    <main className="page-center">
      <div className="card">
        <span className="pill">Before You Begin</span>
        <h1 className="heading" style={{ marginTop: '0.75rem', marginBottom: '0.4rem' }}>
          Your Participant ID
        </h1>

        {/* ID display */}
        <div className="id-label">Please note this ID for reference</div>
        <div className="pill-id" id="participant-id-display">
          {participantId || '…'}
        </div>

        <hr className="divider" />

        {/* Instructions */}
        <h2 className="subheading">Test Instructions</h2>
        <ul className="instructions-list">
          <li className="instruction-item">
            <span className="instruction-num">1</span>
            <span>
              You must select the <strong>COLOR of the ink</strong>, not the word that is written.
            </span>
          </li>
          <li className="instruction-item">
            <span className="instruction-num">2</span>
            <span>
              <strong>Section 1 and 2</strong> have no time limit. Take your time to respond
              accurately.
            </span>
          </li>
          <li className="instruction-item">
            <span className="instruction-num">3</span>
            <span>
              <strong>Section 3 has a time limit.</strong> If you do not respond in time, the trial
              will be skipped automatically.
            </span>
          </li>
        </ul>

        <p className="caption" style={{ margin: '0.5rem 0 1.25rem' }}>
          There are 3 sections with 20 trials each. Click the button below only when you are ready
          to begin.
        </p>

        <button
          id="begin-test-btn"
          className="btn btn-primary btn-full"
          onClick={() => router.push('/test')}
          style={{ fontSize: '1.05rem', padding: '0.9rem' }}
        >
          BEGIN TEST →
        </button>
      </div>
    </main>
  );
}
