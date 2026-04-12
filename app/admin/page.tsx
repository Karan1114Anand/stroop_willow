'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionRow {
  session_id: string;
  participant_id: string;
  started_at: string;
  completed_at: string | null;
  mean_rt_block1: number | null;
  mean_rt_block2: number | null;
  mean_rt_block3: number | null;
  accuracy_block1: number | null;
  accuracy_block2: number | null;
  accuracy_block3: number | null;
  missed_count_block3: number | null;
}

interface DataResponse {
  sessions: SessionRow[];
  count: number;
  earliestDate: string | null;
  latestDate: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);

      const res = await fetch(`/api/admin/data?${params}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load all data on mount
  useEffect(() => { fetchData('', ''); }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  function buildExportUrl() {
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    return `/api/admin/export?${params}`;
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function pct(val: number | null) {
    return val !== null ? `${val.toFixed(1)}%` : '—';
  }

  function ms(val: number | null) {
    return val !== null ? `${val.toFixed(0)} ms` : '—';
  }

  return (
    <div className="admin-page">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="admin-logo">
          🧠 Stroop Research Panel
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={() => router.push('/admin/settings')}
          >
            ⚙️ Settings
          </button>
          <button id="admin-logout-btn" className="btn btn-secondary" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="admin-content">
        {/* Filter Card */}
        <div className="filter-card">
          <h2 className="subheading">Date Range Filter</h2>
          <p className="caption">Filter sessions by start date. Leave empty to include all data.</p>
          <div className="filter-row">
            <div className="form-field">
              <label className="form-label" htmlFor="filter-start">Start Date</label>
              <input
                id="filter-start"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="filter-end">End Date</label>
              <input
                id="filter-end"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              id="filter-apply-btn"
              className="btn btn-primary"
              onClick={() => fetchData(startDate, endDate)}
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? 'Loading…' : 'Apply Filter'}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <h2 className="subheading">Data Summary</h2>

          {error && <div className="error-banner">{error}</div>}

          {data === null && !loading && (
            <div className="empty-state">No data loaded yet.</div>
          )}

          {data !== null && data.count === 0 && (
            <div className="empty-state">
              No sessions found for the selected date range.
            </div>
          )}

          {data !== null && data.count > 0 && (
            <>
              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-value">{data.count}</div>
                  <div className="stat-label">Sessions</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatDate(data.earliestDate)}</div>
                  <div className="stat-label">Earliest Session</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatDate(data.latestDate)}</div>
                  <div className="stat-label">Latest Session</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-value">
                    {data.sessions.filter((s) => s.completed_at !== null).length}
                  </div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>

              {/* Sessions table */}
              <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Participant ID', 'Started', 'RT B1', 'RT B2', 'RT B3', 'Acc B1', 'Acc B2', 'Acc B3', 'Missed B3'].map((h) => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((s) => (
                      <tr key={s.session_id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--purple-600)' }}>
                          {s.participant_id.slice(0, 8)}…
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{formatDate(s.started_at)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{ms(s.mean_rt_block1)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{ms(s.mean_rt_block2)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{ms(s.mean_rt_block3)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pct(s.accuracy_block1)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pct(s.accuracy_block2)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pct(s.accuracy_block3)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{s.missed_count_block3 ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Download Card */}
        <div className="download-card">
          <div className="download-card-info">
            <h3>Export Data as CSV</h3>
            <p>
              {data && data.count > 0
                ? `${data.count} session${data.count !== 1 ? 's' : ''} · formatted for Excel`
                : 'Download all trial-level and summary data'}
            </p>
          </div>
          <a
            id="download-csv-btn"
            href={buildExportUrl()}
            className="btn-download"
            download
          >
            ↓ Download CSV
          </a>
        </div>
      </div>
    </div>
  );
}
