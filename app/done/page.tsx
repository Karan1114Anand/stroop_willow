'use client';

import { useRouter } from 'next/navigation';

export default function DonePage() {
  const router = useRouter();

  return (
    <main className="page-center">
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="done-icon">🧠</div>
        <span className="pill" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
          Test Complete
        </span>
        <h1 className="heading" style={{ marginBottom: '0.75rem' }}>
          Thank You!
        </h1>
        <p className="body-text" style={{ marginBottom: '1rem' }}>
          Your responses have been recorded. You may now close this window.
        </p>
        <p className="caption">
          If you have any questions about this study, please contact the research team with your
          Participant ID.
        </p>

        <hr className="divider" />

        <button
          id="done-close-btn"
          className="btn btn-secondary"
          onClick={() => {
            sessionStorage.clear();
            router.push('/');
          }}
        >
          Return to Start
        </button>
      </div>
    </main>
  );
}
