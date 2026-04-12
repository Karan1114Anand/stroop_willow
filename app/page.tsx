'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAgree() {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      // Store in sessionStorage so the test page can read it
      sessionStorage.setItem('stroop_session_id', data.session_id);
      sessionStorage.setItem('stroop_participant_id', data.participant_id);
      router.push('/instructions');
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Something went wrong. Please refresh and try again.');
    }
  }

  function handleDecline() {
    window.location.href = 'about:blank';
  }

  return (
    <main className="page-center">
      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="pill">Research Study</span>
          <h1 className="heading" style={{ marginTop: '0.75rem' }}>
            Participant Consent
          </h1>
          <p className="body-text" style={{ marginTop: '0.5rem' }}>
            Please read the following information carefully before proceeding.
          </p>
        </div>

        {/* Consent Items */}
        <div className="consent-box">
          <div className="consent-item">
            <span className="consent-icon">🎯</span>
            <span>
              <strong>Study Purpose:</strong> This study measures cognitive interference using the
              Stroop paradigm — specifically, the delay in reaction time when the brain processes
              conflicting colour and word stimuli.
            </span>
          </div>

          <div className="consent-item">
            <span className="consent-icon">🔒</span>
            <span>
              <strong>Data Collected:</strong> Your response times, button selections, and accuracy
              across three blocks of trials. <em>No personal information is collected or stored.</em>
              You are assigned a random anonymous ID.
            </span>
          </div>

          <div className="consent-item">
            <span className="consent-icon">🚪</span>
            <span>
              <strong>Right to Withdraw:</strong> You may close this window at any time to exit the
              study. Participation is entirely voluntary.
            </span>
          </div>
        </div>

        <p className="caption" style={{ margin: '1rem 0' }}>
          By clicking &ldquo;I Agree&rdquo;, you confirm that you have read and understood the above
          information and consent to participate.
        </p>

        {/* Buttons */}
        <div className="consent-btns">
          <button
            id="consent-agree-btn"
            className="btn btn-primary"
            onClick={handleAgree}
            disabled={loading}
          >
            {loading ? 'Starting…' : '✓ I Agree — Continue'}
          </button>
          <button
            id="consent-decline-btn"
            className="btn btn-secondary"
            onClick={handleDecline}
          >
            I Do Not Agree — Exit
          </button>
        </div>
      </div>
    </main>
  );
}
