'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
  id: number;
  time_reduction_ms: number;
  updated_at: string;
  updated_by: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timeReduction, setTimeReduction] = useState<number>(120);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      setTimeReduction(data.time_reduction_ms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_reduction_ms: timeReduction }),
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      const data = await res.json();
      setSettings(data);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="admin-page">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="admin-logo">🧠 Stroop Research Panel</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={() => router.push('/admin')}
          >
            ← Back to Dashboard
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="settings-card">
          <h1 className="heading" style={{ marginBottom: '0.5rem' }}>
            Test Settings
          </h1>
          <p className="body-text" style={{ marginBottom: '2rem' }}>
            Configure parameters for the Stroop test.
          </p>

          {error && <div className="error-banner">{error}</div>}
          {success && (
            <div
              style={{
                background: 'rgba(45, 198, 83, 0.08)',
                border: '1px solid rgba(45, 198, 83, 0.22)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                color: 'var(--green)',
                marginBottom: '1rem',
              }}
            >
              {success}
            </div>
          )}

          {loading ? (
            <div className="empty-state">Loading settings...</div>
          ) : (
            <>
              <div className="setting-section">
                <h2 className="subheading">Block 3 Time Constraint</h2>
                <p className="caption" style={{ marginBottom: '1rem' }}>
                  The time limit for Block 3 is calculated as: <strong>Block 2 Mean RT - Time
                  Reduction</strong> (with a minimum of 100ms).
                </p>

                <div className="form-field" style={{ maxWidth: '300px' }}>
                  <label className="form-label" htmlFor="time-reduction">
                    Time Reduction (milliseconds)
                  </label>
                  <input
                    id="time-reduction"
                    type="number"
                    className="form-input"
                    value={timeReduction}
                    onChange={(e) => setTimeReduction(parseInt(e.target.value) || 0)}
                    min="0"
                    max="5000"
                    step="10"
                  />
                  <p className="caption" style={{ marginTop: '0.5rem' }}>
                    Default: 120ms. Range: 0-5000ms.
                  </p>
                </div>

                <button
                  id="save-settings-btn"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ marginTop: '1.5rem' }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {settings && (
                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'var(--bg-card-alt)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="caption">
                    <strong>Last updated:</strong> {formatDate(settings.updated_at)} by{' '}
                    {settings.updated_by}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
