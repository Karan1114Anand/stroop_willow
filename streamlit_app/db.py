"""
db.py — Database helpers for the Stroop Streamlit app.
Connects to the same Neon PostgreSQL database used by the Next.js app.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

import psycopg2
import psycopg2.extras


def _get_db_url() -> str:
    """Read DATABASE_URL from Streamlit secrets or environment."""
    try:
        import streamlit as st
        return st.secrets["database"]["url"]
    except Exception:
        url = os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError(
                "DATABASE_URL is not configured. "
                "Set it in .streamlit/secrets.toml or as an environment variable."
            )
        return url


def get_connection():
    """Open a new psycopg2 connection (with RealDictCursor)."""
    return psycopg2.connect(
        _get_db_url(),
        cursor_factory=psycopg2.extras.RealDictCursor,
    )


# ─────────────────────────────────────────────────────────
# Participant-facing operations
# ─────────────────────────────────────────────────────────

def create_session() -> tuple[str, str]:
    """Insert a new session row; return (session_id, participant_id)."""
    session_id = str(uuid.uuid4())
    # Short uppercase ID shown to participant
    participant_id = uuid.uuid4().hex[:8].upper()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (session_id, participant_id, started_at)"
                " VALUES (%s, %s, %s)",
                (session_id, participant_id, datetime.now(IST)),
            )
    return session_id, participant_id


def save_trials(session_id: str, participant_id: str, trials: list) -> None:
    """Bulk-insert trial rows."""
    if not trials:
        return

    with get_connection() as conn:
        with conn.cursor() as cur:
            for t in trials:
                cur.execute(
                    """
                    INSERT INTO trials (
                        session_id, participant_id,
                        block_number, block_type, trial_number,
                        word_shown, ink_color, user_response,
                        outcome, reaction_time_ms, created_at
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT DO NOTHING
                    """,
                    (
                        session_id,
                        participant_id,
                        t["block_number"],
                        t["block_type"],
                        t["trial_number"],
                        t["word_shown"],
                        t["ink_color"],
                        t.get("user_response"),
                        t["outcome"],
                        t.get("reaction_time_ms"),
                        datetime.now(IST),
                    ),
                )


def complete_session(session_id: str, summary: dict) -> None:
    """Mark session as complete and store summary metrics."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sessions SET
                    completed_at        = %s,
                    mean_rt_block1      = %s,
                    mean_rt_block2      = %s,
                    mean_rt_block3      = %s,
                    overall_mean_rt     = %s,
                    time_constraint_ms  = %s,
                    accuracy_block1     = %s,
                    accuracy_block2     = %s,
                    accuracy_block3     = %s,
                    missed_count_block3 = %s
                WHERE session_id = %s
                """,
                (
                    datetime.now(IST),
                    summary.get("mean_rt_block1"),
                    summary.get("mean_rt_block2"),
                    summary.get("mean_rt_block3"),
                    summary.get("overall_mean_rt"),
                    summary.get("time_constraint_ms"),
                    summary.get("accuracy_block1"),
                    summary.get("accuracy_block2"),
                    summary.get("accuracy_block3"),
                    summary.get("missed_count_block3"),
                    session_id,
                ),
            )


# ─────────────────────────────────────────────────────────
# Admin operations
# ─────────────────────────────────────────────────────────

def get_sessions(start_date=None, end_date=None) -> list[dict]:
    """Fetch sessions (with nested trials) filtered by date range."""
    conditions: list[str] = []
    params: list = []

    if start_date:
        conditions.append("s.started_at >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("s.started_at < (%s::date + interval '1 day')")
        params.append(end_date)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT * FROM sessions s {where} ORDER BY s.started_at ASC",
                params,
            )
            sessions = [dict(r) for r in cur.fetchall()]

            if sessions:
                sids = [s["session_id"] for s in sessions]
                cur.execute(
                    """
                    SELECT * FROM trials
                    WHERE session_id = ANY(%s)
                    ORDER BY session_id, block_number, trial_number
                    """,
                    (sids,),
                )
                trials = [dict(r) for r in cur.fetchall()]

                by_session: dict[str, list] = {}
                for t in trials:
                    by_session.setdefault(t["session_id"], []).append(t)

                for s in sessions:
                    s["trials"] = by_session.get(s["session_id"], [])

    return sessions


def get_time_reduction_pct() -> int:
    """Return the current time_reduction_pct setting (default 20)."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS time_reduction_pct INTEGER DEFAULT 20"
                )
                cur.execute("SELECT time_reduction_pct FROM settings ORDER BY id LIMIT 1")
                row = cur.fetchone()
                if row and row["time_reduction_pct"] is not None:
                    return int(row["time_reduction_pct"])
                cur.execute(
                    "INSERT INTO settings (time_reduction_pct, updated_by) VALUES (20, 'system')"
                    " RETURNING time_reduction_pct"
                )
                return 20
    except Exception:
        return 20


def update_time_reduction_pct(value: int, updated_by: str = "admin") -> None:
    """Upsert the time_reduction_pct setting."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "ALTER TABLE settings ADD COLUMN IF NOT EXISTS time_reduction_pct INTEGER DEFAULT 20"
            )
            cur.execute("SELECT id FROM settings ORDER BY id LIMIT 1")
            row = cur.fetchone()
            if row:
                cur.execute(
                    "UPDATE settings SET time_reduction_pct=%s, updated_at=NOW(), updated_by=%s WHERE id=%s",
                    (value, updated_by, row["id"]),
                )
            else:
                cur.execute(
                    "INSERT INTO settings (time_reduction_pct, updated_by) VALUES (%s, %s)",
                    (value, updated_by),
                )
