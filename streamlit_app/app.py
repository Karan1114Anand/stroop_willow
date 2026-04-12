"""
app.py — Stroop Cognitive Interference Test  (Streamlit frontend)

Run:   streamlit run app.py
Admin: click "Admin" in the sidebar
"""
import os
import json
import threading
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer

import bcrypt
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

import db

# ─────────────────────────────────────────────────────────
# Page config
# ─────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Stroop Color-Word Test",
    page_icon="🐈",
    layout="centered",
    initial_sidebar_state="auto",  
)

# ─────────────────────────────────────────────────────────
# Global CSS — matches the DM Sans / warm-neutral design system
# ─────────────────────────────────────────────────────────
st.html("""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">
<style>
/* ── Light theme (Streamlit page) ── */
:root {
  --bg:           #F5F3EF;
  --surface:      #EDEAE3;
  --border:       #D8D3C8;
  --text:         #2C2A27;
  --text-muted:   #7A7670;
  --accent:       #7C6FA0;
  --accent-light: #EDE9F5;
  --accent-dark:  #5A4F7A;
  --card-bg:      #FFFFFF;
}

/* ── Dark theme (Streamlit page) ── */
[data-stroop-theme="dark"] {
  --bg:           #1A1917;
  --surface:      #242220;
  --border:       #3A3733;
  --text:         #E8E4DC;
  --text-muted:   #9A9590;
  --accent:       #9C8FC0;
  --accent-light: #27233A;
  --accent-dark:  #BEB0DE;
  --card-bg:      #242220;
}

[data-stroop-theme="dark"] .stApp,
[data-stroop-theme="dark"] .stApp > * {
  background-color: var(--bg) !important;
  color: var(--text) !important;
}

[data-stroop-theme="dark"] .main .block-container {
  background-color: var(--bg) !important;
}

[data-stroop-theme="dark"] [data-testid="stSidebar"] {
  background: var(--surface) !important;
  border-right: 1px solid var(--border) !important;
}

[data-stroop-theme="dark"] [data-testid="stSidebar"] .stButton > button {
  background: var(--card-bg) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
}

/* ── Font override ── */
html, body, [class*="css"], .stMarkdown, .stButton, .stTextInput, .stNumberInput {
  font-family: 'DM Sans', Arial, sans-serif !important;
}

/* ── Hide Streamlit chrome ── */
##MainMenu, footer { visibility: hidden; }
.stDeployButton { display: none !important; }
[data-testid="stToolbar"] { display: none !important; }

/* keep header visible so sidebar toggle can work */
header {
  visibility: visible !important;
  background: transparent !important;
}

/* ── Main container ── */
.main .block-container {
  max-width: 660px !important;
  padding-top: 2.2rem !important;
  padding-bottom: 4rem !important;
}

/* ── Headings ── */
h1 { font-size: 24px !important; font-weight: 600 !important; }
h2 { font-size: 20px !important; font-weight: 600 !important; }
h3 { font-size: 16px !important; font-weight: 500 !important; }

/* ── Primary buttons ── */
.stButton > button {
  font-family: 'DM Sans', sans-serif !important;
  font-weight: 500 !important;
  border-radius: 10px !important;
  padding: 10px 18px !important;
  font-size: 14.5px !important;
  transition: all .18s !important;
  border: none !important;
}
.stButton > button[kind="primary"] {
  background: #7C6FA0 !important;
  color: #fff !important;
  box-shadow: 0 3px 12px rgba(124,111,160,0.32) !important;
}
.stButton > button[kind="primary"]:hover {
  background: #5A4F7A !important;
  box-shadow: 0 5px 18px rgba(124,111,160,0.4) !important;
}
.stButton > button[kind="secondary"] {
  background: #EDEAE3 !important;
  color: #2C2A27 !important;
  border: 1px solid #D8D3C8 !important;
}
.stButton > button[kind="secondary"]:hover {
  background: #E0DDD6 !important;
}

/* ── Form inputs ── */
.stTextInput > div > div > input,
.stNumberInput > div > div > input,
.stPasswordInput > div > div > input {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 14.5px !important;
  border-radius: 10px !important;
  border: 1.5px solid #D8D3C8 !important;
  padding: 10px 14px !important;
  background: #F5F3EF !important;
}
.stTextInput > div > div > input:focus,
.stNumberInput > div > div > input:focus {
  border-color: #7C6FA0 !important;
  box-shadow: 0 0 0 2px rgba(124,111,160,0.15) !important;
}

/* ── Divider ── */
hr { border-color: #D8D3C8 !important; margin: 1.2rem 0 !important; }

/* ── Info / success / error boxes ── */
.stAlert { border-radius: 10px !important; font-size: 14px !important; }

/* ── Metrics ── */
[data-testid="metric-container"] {
  background: #EDEAE3 !important;
  border: 1px solid #D8D3C8 !important;
  border-radius: 12px !important;
  padding: 14px !important;
}

/* ── Dataframe ── */
[data-testid="stDataFrame"] {
  border: 1px solid #D8D3C8 !important;
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* ── Download button ── */
.stDownloadButton > button {
  font-family: 'DM Sans', sans-serif !important;
  border-radius: 10px !important;
  font-weight: 500 !important;
  font-size: 14.5px !important;
}

/* ── Sidebar ── */
[data-testid="stSidebar"] {
  background: #EDEAE3 !important;
  border-right: 1px solid #D8D3C8 !important;
}
[data-testid="stSidebar"] .stButton > button {
  background: #fff !important;
  border: 1px solid #D8D3C8 !important;
  color: #2C2A27 !important;
  border-radius: 8px !important;
}
[data-testid="stSidebar"] .stButton > button:hover {
  background: #F5F3EF !important;
  border-color: #7C6FA0 !important;
}

/* ── Sidebar toggle button (hamburger) ── */
[data-testid="collapsedControl"] {
  width: 52px !important;
  height: 52px !important;
  background: #7C6FA0 !important;
  border-radius: 12px !important;
  margin-top: 12px !important;
  margin-left: 8px !important;
  box-shadow: 0 4px 14px rgba(124,111,160,0.45) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}
[data-testid="collapsedControl"]:hover {
  background: #5A4F7A !important;
  box-shadow: 0 6px 20px rgba(124,111,160,0.55) !important;
}
[data-testid="collapsedControl"] svg {
  width: 22px !important;
  height: 22px !important;
  color: #fff !important;
  fill: #fff !important;
}
[data-stroop-theme="dark"] [data-testid="collapsedControl"] {
  background: #9C8FC0 !important;
  box-shadow: 0 4px 14px rgba(156,143,192,0.35) !important;
}

/* ── Eyebrow label helper ── */
.eyebrow {
  font-family: 'DM Mono', monospace !important;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: #7C6FA0;
  margin-bottom: 4px; display: block;
}
</style>
<script>
  // Apply saved theme to parent Streamlit page on load
  (function() {
    var saved = localStorage.getItem("stroop_theme") || "light";
    document.documentElement.setAttribute("data-stroop-theme", saved);
  })();
</script>
""")

# ─────────────────────────────────────────────────────────
# Background HTTP server — receives test results from JS
# ─────────────────────────────────────────────────────────
_API_PORT = 8599
_server_started = False


class _ResultHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            sid  = body.get("session_id", "")
            pid  = body.get("participant_id", "")
            db.save_trials(sid, pid, body.get("trials", []))
            db.complete_session(sid, body.get("summary", {}))
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        except Exception as e:
            self.send_response(500)
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, *_): pass


def _start_api_server():
    global _server_started
    if _server_started:
        return
    try:
        server = HTTPServer(("localhost", _API_PORT), _ResultHandler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        _server_started = True
    except OSError:
        _server_started = True   # already running (hot-reload)


_start_api_server()

# ─────────────────────────────────────────────────────────
# Session state defaults
# ─────────────────────────────────────────────────────────
_DEFAULTS = {
    "page": "consent",
    "session_id": None,
    "participant_id": None,
    "admin_logged_in": False,
    "admin_username": "",
}
for _k, _v in _DEFAULTS.items():
    if _k not in st.session_state:
        st.session_state[_k] = _v


def go_to(page: str) -> None:
    st.session_state.page = page
    st.rerun()


# ─────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────
def verify_admin(username: str, password: str) -> bool:
    try:
        if username != st.secrets["admin"]["username"]:
            return False
        return bcrypt.checkpw(password.encode(), st.secrets["admin"]["password_hash"].encode())
    except Exception:
        return False


# ─────────────────────────────────────────────────────────
# CSV export
# ─────────────────────────────────────────────────────────
def _esc(val) -> str:
    if val is None:
        return ""
    s = str(val)
    if "," in s or '"' in s or "\n" in s:
        return '"' + s.replace('"', '""') + '"'
    return s


def generate_csv(sessions: list) -> bytes:
    lines = []
    lines.append("SECTION 1: Trial-Level Data")
    lines.append(",".join(["session_id","participant_id","started_at",
        "block_number","block_type","trial_number","word_shown","ink_color",
        "user_response","outcome","reaction_time_ms","created_at"]))
    for s in sessions:
        for t in s.get("trials", []):
            lines.append(",".join(_esc(x) for x in [
                s["session_id"], s["participant_id"],
                s["started_at"].isoformat() if s.get("started_at") else "",
                t["block_number"], t["block_type"], t["trial_number"],
                t["word_shown"], t["ink_color"],
                t.get("user_response",""), t["outcome"],
                t.get("reaction_time_ms",""),
                t["created_at"].isoformat() if t.get("created_at") else "",
            ]))
    lines += ["",""]
    lines.append("SECTION 2: Per-Participant Summary Statistics")
    lines.append(",".join(["session_id","participant_id","started_at","completed_at",
        "mean_RT_block1","mean_RT_block2","mean_RT_block3","overall_mean_RT",
        "reaction_speed_block1","reaction_speed_block2","reaction_speed_block3",
        "time_constraint_used_ms","accuracy_block1_%","accuracy_block2_%",
        "accuracy_block3_%","missed_count_block3"]))
    for s in sessions:
        def fmt(v): return f"{v:.2f}" if v is not None else ""
        def spd(v): return f"{1/v:.6f}" if v else ""
        lines.append(",".join(_esc(x) for x in [
            s["session_id"], s["participant_id"],
            s["started_at"].isoformat() if s.get("started_at") else "",
            s["completed_at"].isoformat() if s.get("completed_at") else "",
            fmt(s.get("mean_rt_block1")), fmt(s.get("mean_rt_block2")), fmt(s.get("mean_rt_block3")),
            fmt(s.get("overall_mean_rt")),
            spd(s.get("mean_rt_block1")), spd(s.get("mean_rt_block2")), spd(s.get("mean_rt_block3")),
            fmt(s.get("time_constraint_ms")),
            fmt(s.get("accuracy_block1")), fmt(s.get("accuracy_block2")), fmt(s.get("accuracy_block3")),
            s.get("missed_count_block3",""),
        ]))
    return "\r\n".join(lines).encode("utf-8")


# ─────────────────────────────────────────────────────────
# Test HTML builder
# ─────────────────────────────────────────────────────────
def _build_test_html(session_id: str, participant_id: str, time_reduction_ms: int) -> str:
    html_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "stroop_component", "index.html"
    )
    template = open(html_path, encoding="utf-8").read()
    config_js = f"""<script>
  window.STROOP_CONFIG = {{
    session_id:       {json.dumps(session_id)},
    participant_id:   {json.dumps(participant_id)},
    time_reduction_ms:{int(time_reduction_ms)},
    api_url:          "http://localhost:{_API_PORT}/submit"
  }};
</script>"""
    return template.replace("</head>", config_js + "\n</head>", 1)


# ─────────────────────────────────────────────────────────
# PAGES
# ─────────────────────────────────────────────────────────

def page_consent():
    st.title("Stroop Color-Word Test")
    st.markdown(
        '<p style="color:#7A7670;font-size:14px;margin-top:-8px;margin-bottom:20px">'
        "Participant Consent Form</p>",
        unsafe_allow_html=True,
    )

    st.markdown("""
<div style="background:#fff;border:1px solid #D8D3C8;border-radius:14px;padding:26px 28px;box-shadow:0 2px 16px rgba(0,0,0,0.06)">

<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px">

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:13px 15px;font-size:14px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">1</span>
<span><strong>Study Purpose</strong> — This study measures cognitive interference using the Stroop paradigm: the delay in reaction time when the brain processes conflicting colour and word stimuli.</span>
</li>

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:13px 15px;font-size:14px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">2</span>
<span><strong>Data Collected</strong> — Response times, accuracy, and button selections across 3 sections of trials. <em>No personal information is stored.</em> You receive a random anonymous ID.</span>
</li>

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:13px 15px;font-size:14px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">3</span>
<span><strong>Right to Withdraw</strong> — You may close this window at any time. Participation is entirely voluntary.</span>
</li>

</ul>
</div>
""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns([3, 2])
    with col1:
        if st.button("✓  I Agree — Continue", type="primary", use_container_width=True):
            with st.spinner("Starting session…"):
                sid, pid = db.create_session()
            st.session_state.session_id = sid
            st.session_state.participant_id = pid
            go_to("instructions")
    with col2:
        if st.button("Decline", use_container_width=True):
            st.info("Thank you for your time. You may close this window.")


def page_instructions():
    st.markdown('<span class="eyebrow">Before you begin</span>', unsafe_allow_html=True)
    st.title("Instructions")

    pid = st.session_state.participant_id or "—"
    st.markdown(f"""
<div style="background:#EDE9F5;border:1px solid #D8D3C8;border-radius:12px;
            padding:16px 20px;margin-bottom:20px;font-size:14px;line-height:1.6">
  <span style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;
               text-transform:uppercase;color:#7C6FA0;display:block;margin-bottom:6px">
    Your Participant ID
  </span>
  <code style="font-size:18px;font-weight:600;color:#2C2A27;letter-spacing:.08em">{pid}</code>
  <span style="color:#7A7670;font-size:12.5px;display:block;margin-top:4px">
    Note this ID if your researcher asks for it.
  </span>
</div>
""", unsafe_allow_html=True)

    st.markdown("""
<div style="background:#fff;border:1px solid #D8D3C8;border-radius:14px;padding:26px 28px;
            box-shadow:0 2px 16px rgba(0,0,0,0.06);margin-bottom:20px">

<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px">

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">1</span>
<span>A color word will appear in colored ink. Select the <strong>color of the ink</strong>, not what the word says.
Example: if you see <span style="color:#2471A3;font-weight:600">RED</span>, press the <strong>blue</strong> circle.</span>
</li>

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">2</span>
<span><strong>Sections 1 &amp; 2</strong> have <span style="background:#fff;border:1px solid #D8D3C8;border-radius:4px;padding:1px 6px;font-family:monospace;font-size:11.5px;color:#5A4F7A">no time limit</span>. Work at a steady pace.</span>
</li>

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">3</span>
<span><strong>Section 3</strong> has a <span style="background:#fff;border:1px solid #D8D3C8;border-radius:4px;padding:1px 6px;font-family:monospace;font-size:11.5px;color:#5A4F7A">personal time limit</span> based on your Section 2 speed. Respond before the bar runs out.</span>
</li>

<li style="display:flex;gap:12px;align-items:flex-start;background:#EDE9F5;border:1px solid #D8D3C8;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.65">
<span style="background:#7C6FA0;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9.5px;flex-shrink:0;margin-top:2px">4</span>
<span>Press the <strong>coloured circle</strong> matching the ink. The buttons have <strong>no text labels</strong>.</span>
</li>

</ul>
</div>
""", unsafe_allow_html=True)

    if st.button("Begin Test →", type="primary", use_container_width=True):
        go_to("test")


def page_test():
    if st.query_params.get("test_done") == "1":
        st.query_params.clear()
        go_to("done")
        return

    sid = st.session_state.session_id or ""
    pid = st.session_state.participant_id or ""
    time_reduction_ms = db.get_time_reduction_ms()

    html = _build_test_html(sid, pid, time_reduction_ms)
    components.html(html, height=740, scrolling=False)


def page_done():
    st.markdown('<span class="eyebrow">Test Complete</span>', unsafe_allow_html=True)
    st.title("Thank You!")

    pid = st.session_state.participant_id or "—"
    st.markdown(f"""
<div style="background:#fff;border:1px solid #D8D3C8;border-radius:14px;padding:28px 30px;
            box-shadow:0 2px 16px rgba(0,0,0,0.06);text-align:center;margin-bottom:20px">
  <div style="width:56px;height:56px;border-radius:50%;background:#EDE9F5;border:2px solid #D8D3C8;
              display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 16px">✓</div>
  <p style="font-size:16px;font-weight:500;margin-bottom:8px">Your responses have been recorded.</p>
  <p style="font-size:13.5px;color:#7A7670;line-height:1.65">
    Participant ID: <code style="font-size:14px;color:#2C2A27">{pid}</code><br>
    Please let the researcher know you have finished.
  </p>
</div>
""", unsafe_allow_html=True)

    if st.button("Start a New Session", use_container_width=True):
        for k in ("session_id", "participant_id"):
            st.session_state[k] = None
        go_to("consent")


# ── Admin ────────────────────────────────────────────────

def page_admin_login():
    st.markdown('<span class="eyebrow">Researcher Access</span>', unsafe_allow_html=True)
    st.title("Admin Login")
    st.divider()

    with st.form("admin_login"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login →", type="primary", use_container_width=True)

    if submitted:
        if verify_admin(username, password):
            st.session_state.admin_logged_in = True
            st.session_state.admin_username = username
            go_to("admin_dashboard")
        else:
            st.error("Incorrect username or password.")

    st.divider()
    if st.button("← Back to Test"):
        go_to("consent")


def page_admin_dashboard():
    if not st.session_state.admin_logged_in:
        go_to("admin_login")
        return

    col_t, col_s, col_l = st.columns([4, 1, 1])
    with col_t:
        st.markdown('<span class="eyebrow">Researcher Dashboard</span>', unsafe_allow_html=True)
        st.title("Data Overview")
    with col_s:
        if st.button("⚙", use_container_width=True, help="Settings"):
            go_to("admin_settings")
    with col_l:
        if st.button("Logout", use_container_width=True):
            st.session_state.admin_logged_in = False
            go_to("admin_login")

    st.divider()

    col_a, col_b = st.columns(2)
    with col_a:
        start_date = st.date_input("From", value=None, key="dash_start")
    with col_b:
        end_date   = st.date_input("To",   value=None, key="dash_end")

    with st.spinner("Loading…"):
        sessions = db.get_sessions(start_date=start_date, end_date=end_date)

    if not sessions:
        st.info("No sessions found for the selected date range.")
        return

    completed = [s for s in sessions if s.get("completed_at") is not None]
    m1, m2, m3 = st.columns(3)
    m1.metric("Total Sessions", len(sessions))
    m2.metric("Completed",      len(completed))
    m3.metric("Completion Rate",
              f"{len(completed)/len(sessions)*100:.0f}%" if sessions else "0%")

    st.divider()

    rows = []
    for s in sessions:
        rows.append({
            "participant_id": s.get("participant_id"),
            "started_at":     s.get("started_at"),
            "completed_at":   s.get("completed_at"),
            "mean_RT_B1":     round(s["mean_rt_block1"], 1) if s.get("mean_rt_block1") else None,
            "mean_RT_B2":     round(s["mean_rt_block2"], 1) if s.get("mean_rt_block2") else None,
            "mean_RT_B3":     round(s["mean_rt_block3"], 1) if s.get("mean_rt_block3") else None,
            "acc_B1_%":       round(s["accuracy_block1"], 1) if s.get("accuracy_block1") else None,
            "acc_B2_%":       round(s["accuracy_block2"], 1) if s.get("accuracy_block2") else None,
            "acc_B3_%":       round(s["accuracy_block3"], 1) if s.get("accuracy_block3") else None,
            "time_constraint":round(s["time_constraint_ms"]) if s.get("time_constraint_ms") else None,
            "missed_B3":      s.get("missed_count_block3"),
        })

    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    st.divider()
    st.download_button(
        label="⬇  Export Full CSV",
        data=generate_csv(sessions),
        file_name=f"stroop_data_{date.today().isoformat()}.csv",
        mime="text/csv",
        type="primary",
        use_container_width=True,
    )


def page_admin_settings():
    if not st.session_state.admin_logged_in:
        go_to("admin_login")
        return

    col_t, col_b = st.columns([4, 1])
    with col_t:
        st.markdown('<span class="eyebrow">Configuration</span>', unsafe_allow_html=True)
        st.title("Settings")
    with col_b:
        if st.button("← Back", use_container_width=True):
            go_to("admin_dashboard")

    st.divider()
    current = db.get_time_reduction_ms()

    st.markdown("""
<div style="background:#EDEAE3;border:1px solid #D8D3C8;border-radius:10px;
            padding:16px 18px;font-size:13.5px;color:#7A7670;line-height:1.7;margin-bottom:20px">
<strong style="color:#2C2A27">Block 3 adaptive time limit</strong><br>
<code style="background:#fff;border:1px solid #D8D3C8;border-radius:4px;padding:2px 8px;
             font-size:12px;color:#5A4F7A">
  time_limit = Section 2 mean RT − time_reduction &nbsp;(min 200 ms)
</code><br>
A larger reduction → shorter limit → more cognitive pressure.
</div>
""", unsafe_allow_html=True)

    new_val = st.number_input(
        "Time Reduction (ms)",
        min_value=50, max_value=5000, value=current, step=10,
    )
    if st.button("Save", type="primary", use_container_width=True):
        db.update_time_reduction_ms(int(new_val), st.session_state.admin_username or "admin")
        st.success(f"Saved — time_reduction = {new_val} ms")


# ─────────────────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────────────────
with st.sidebar:
    st.html("""
<script>
  /* Run BEFORE CSS paints — sets data-t on <html> synchronously */
  document.documentElement.setAttribute(
    'data-t', localStorage.getItem('stroop_theme') === 'dark' ? 'dark' : 'light'
  );
</script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: transparent !important; }

  .sw-wrap  { padding: 12px 2px 18px 2px; }
  .sw-inner { display: flex; align-items: center; gap: 11px; }

  .sw-text  {
    font-family: 'DM Sans', Arial, sans-serif;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1;
  }
  /* Light mode */
  [data-t="light"] .sw-text         { color: #2C2A27; }
  [data-t="light"] .sw-text-accent  { color: #7C6FA0; }
  /* Dark mode */
  [data-t="dark"]  .sw-text         { color: #E8E4DC; }
  [data-t="dark"]  .sw-text-accent  { color: #BEB0DE; }
</style>

<div class="sw-wrap">
  <div class="sw-inner">
    <svg width="42" height="42" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;display:block;">
      <rect width="42" height="42" rx="11" fill="#7C6FA0"/>
      <circle cx="13" cy="13" r="6" fill="#E05C4B"/>
      <circle cx="29" cy="13" r="6" fill="#4A9FD4"/>
      <circle cx="13" cy="29" r="6" fill="#4CAF70"/>
      <circle cx="29" cy="29" r="6" fill="#E0B830"/>
      <rect width="42" height="42" rx="11" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    </svg>
    <div class="sw-text">
      <span class="sw-text-accent">STROOP</span>&nbsp;WILLOW
    </div>
  </div>
</div>

<script>
  /* Keep in sync when user clicks the theme toggle */
  window.addEventListener('storage', function(e) {
    if (e.key === 'stroop_theme') {
      document.documentElement.setAttribute('data-t', e.newValue === 'dark' ? 'dark' : 'light');
    }
  });
</script>
""")
    if st.session_state.admin_logged_in:
        st.success(f"Logged in as **{st.session_state.admin_username}**")
        if st.button("Dashboard", key="sb_dash", use_container_width=True):
            go_to("admin_dashboard")
        if st.button("Settings",  key="sb_set",  use_container_width=True):
            go_to("admin_settings")
        if st.button("Logout",    key="sb_out",  use_container_width=True):
            st.session_state.admin_logged_in = False
            go_to("admin_login")
    else:
        if st.button("Admin Login", key="sb_adm", use_container_width=True):
            go_to("admin_login")

# ─────────────────────────────────────────────────────────
# Theme toggle + dark mode — injected into real Streamlit page DOM
# components.html() runs in an iframe; window.parent reaches the actual page
# ─────────────────────────────────────────────────────────
components.html("""
<script>
(function() {
  var P = window.parent.document;

  // ── Button style (once) ──
  if (!P.getElementById('stroop-btn-style')) {
    var bs = P.createElement('style');
    bs.id = 'stroop-btn-style';
    bs.textContent =
      '#stroop-theme-btn{position:fixed;top:14px;right:14px;z-index:99999;' +
      'background:#fff;border:1px solid #D8D3C8;border-radius:8px;' +
      'width:36px;height:36px;font-size:17px;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.2s;' +
      'line-height:1;border:none;}' +
      '#stroop-theme-btn:hover{background:#EDEAE3;}' +
      '[data-stroop-theme="dark"] #stroop-theme-btn{background:#2C2A27;border:1px solid #3A3733;color:#E8E4DC;}' +
      '[data-stroop-theme="dark"] #stroop-theme-btn:hover{background:#3A3733;}';
    P.head.appendChild(bs);
  }

  // ── Full dark-mode stylesheet (once) ──
  if (!P.getElementById('stroop-dark-style')) {
    var ds = P.createElement('style');
    ds.id = 'stroop-dark-style';
    ds.textContent =
      // App shell
      '[data-stroop-theme="dark"] .stApp{background-color:#1A1917!important;}' +
      '[data-stroop-theme="dark"] section.main{background-color:#1A1917!important;}' +
      '[data-stroop-theme="dark"] .main .block-container{background-color:#1A1917!important;}' +
      // Headings & body text
      '[data-stroop-theme="dark"] h1,[data-stroop-theme="dark"] h2,[data-stroop-theme="dark"] h3{color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] p{color:#9A9590!important;}' +
      '[data-stroop-theme="dark"] .stMarkdown{color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] .stMarkdown span{color:inherit!important;}' +
      // Code / pill spans
      '[data-stroop-theme="dark"] code{background:#2C2A27!important;color:#BEB0DE!important;border-color:#3A3733!important;}' +
      // Card wrappers (white divs in st.markdown)
      '[data-stroop-theme="dark"] .stMarkdown div[style]{background-color:#242220!important;border-color:#3A3733!important;color:#E8E4DC!important;}' +
      // List items (lavender accent-light)
      '[data-stroop-theme="dark"] .stMarkdown li{background-color:#27233A!important;border-color:#3A3733!important;color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] .stMarkdown li span{color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] .stMarkdown li strong{color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] .stMarkdown li em{color:#9A9590!important;}' +
      // Inline styled spans (participant-ID code boxes etc.)
      '[data-stroop-theme="dark"] .stMarkdown span[style]{color:#BEB0DE!important;background:#2C2A27!important;border-color:#3A3733!important;}' +
      // Secondary buttons
      '[data-stroop-theme="dark"] .stButton>button[kind="secondary"]{background:#2C2A27!important;color:#E8E4DC!important;border-color:#3A3733!important;}' +
      '[data-stroop-theme="dark"] .stButton>button[kind="secondary"]:hover{background:#3A3733!important;}' +
      // Alerts
      '[data-stroop-theme="dark"] .stAlert{background:#242220!important;color:#E8E4DC!important;border-color:#3A3733!important;}' +
      // Sidebar
      '[data-stroop-theme="dark"] [data-testid="stSidebar"]{background-color:#242220!important;border-right-color:#3A3733!important;}' +
      '[data-stroop-theme="dark"] [data-testid="stSidebar"] .stButton>button{background:#2C2A27!important;color:#E8E4DC!important;border-color:#3A3733!important;}' +
      '[data-stroop-theme="dark"] [data-testid="stSidebar"] .stButton>button:hover{background:#3A3733!important;border-color:#9C8FC0!important;}' +
      // Inputs
      '[data-stroop-theme="dark"] input{background:#2C2A27!important;color:#E8E4DC!important;border-color:#3A3733!important;}' +
      // Metrics & dataframe
      '[data-stroop-theme="dark"] [data-testid="metric-container"]{background:#242220!important;border-color:#3A3733!important;}' +
      '[data-stroop-theme="dark"] [data-testid="metric-container"] *{color:#E8E4DC!important;}' +
      '[data-stroop-theme="dark"] [data-testid="stDataFrame"]{border-color:#3A3733!important;}';
    P.head.appendChild(ds);
  }

  // ── Button: remove stale, re-create each render ──
  var old = P.getElementById('stroop-theme-btn');
  if (old) old.remove();

  var saved = localStorage.getItem('stroop_theme') || 'light';
  P.documentElement.setAttribute('data-stroop-theme', saved);

  var btn = P.createElement('button');
  btn.id    = 'stroop-theme-btn';
  btn.title = 'Toggle dark / light theme';
  btn.textContent = saved === 'dark' ? '\u2600\ufe0f' : '\U0001F319';

  btn.onclick = function() {
    var curr = P.documentElement.getAttribute('data-stroop-theme') || 'light';
    var next = curr === 'dark' ? 'light' : 'dark';
    P.documentElement.setAttribute('data-stroop-theme', next);
    localStorage.setItem('stroop_theme', next);
    btn.textContent = next === 'dark' ? '\u2600\ufe0f' : '\U0001F319';
    P.querySelectorAll('iframe').forEach(function(f) {
      try {
        f.contentDocument.documentElement.setAttribute('data-theme', next);
        var ib = f.contentDocument.getElementById('theme-btn');
        if (ib) ib.textContent = next === 'dark' ? '\u2600\ufe0f' : '\U0001F319';
      } catch(e) {}
    });
  };

  P.body.appendChild(btn);
})();
</script>
""", height=0)

# ─────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────
PAGE = st.session_state.page
if   PAGE == "consent":         page_consent()
elif PAGE == "instructions":    page_instructions()
elif PAGE == "test":            page_test()
elif PAGE == "done":            page_done()
elif PAGE == "admin_login":     page_admin_login()
elif PAGE == "admin_dashboard": page_admin_dashboard()
elif PAGE == "admin_settings":  page_admin_settings()
else:                           go_to("consent")
