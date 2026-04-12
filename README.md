# Stroop Willow - Cognitive Interference Test

A Streamlit-based implementation of the Stroop cognitive interference test for research purposes. This application measures reaction times and accuracy across three test blocks to assess cognitive interference effects.

## Overview

This application implements a three-block Stroop test:
- **Block 1**: Congruent trials (word matches ink color) - No time limit
- **Block 2**: Incongruent trials (word does not match ink color) - No time limit  
- **Block 3**: Time-constrained incongruent trials with adaptive time limit based on Block 2 performance

## Features

### Participant Experience
- Informed consent page
- Clear test instructions with participant ID
- Three-block test with 20 trials each
- Fixation cross between trials
- Visual countdown timer for Block 3
- Reaction time measurement (millisecond precision)
- Missed trial feedback
- Completion confirmation

### Admin Panel
- Secure bcrypt-based authentication
- Session data dashboard with date range filtering
- Configurable time constraint settings
- CSV data export (trial-level and summary statistics)
- Real-time statistics and metrics
- Light/Dark theme toggle

### Technical Features
- PostgreSQL database (Neon serverless)
- Anonymous participant tracking (UUID-based)
- Comprehensive input validation
- Responsive design with custom styling
- Background HTTP server for test result submission

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL database (Neon recommended)
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StroopWillow
   ```

2. **Install Python dependencies**
   ```bash
   cd streamlit_app
   pip install -r requirements.txt
   ```

3. **Set up database**
   
   Create the required tables in your PostgreSQL database:
   
   ```sql
   CREATE TABLE sessions (
       session_id UUID PRIMARY KEY,
       participant_id VARCHAR(255) NOT NULL,
       started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       completed_at TIMESTAMP WITH TIME ZONE,
       mean_rt_block1 FLOAT,
       mean_rt_block2 FLOAT,
       mean_rt_block3 FLOAT,
       overall_mean_rt FLOAT,
       time_constraint_ms FLOAT,
       accuracy_block1 FLOAT,
       accuracy_block2 FLOAT,
       accuracy_block3 FLOAT,
       missed_count_block3 INTEGER
   );

   CREATE TABLE trials (
       id SERIAL PRIMARY KEY,
       session_id UUID REFERENCES sessions(session_id),
       participant_id VARCHAR(255) NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       block_number INTEGER NOT NULL,
       block_type VARCHAR(50) NOT NULL,
       trial_number INTEGER NOT NULL,
       word_shown VARCHAR(50) NOT NULL,
       ink_color VARCHAR(50) NOT NULL,
       user_response VARCHAR(50),
       outcome VARCHAR(50) NOT NULL,
       reaction_time_ms INTEGER
   );

   CREATE TABLE settings (
       id SERIAL PRIMARY KEY,
       time_reduction_ms INTEGER DEFAULT 120,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_by VARCHAR(255) DEFAULT 'system'
   );

   CREATE INDEX idx_sessions_started_at ON sessions(started_at);
   CREATE INDEX idx_sessions_participant_id ON sessions(participant_id);
   CREATE INDEX idx_trials_session_id ON trials(session_id);
   CREATE INDEX idx_trials_participant_id ON trials(participant_id);
   CREATE INDEX idx_trials_created_at ON trials(created_at);
   ```

4. **Configure secrets**
   
   Copy the example secrets file:
   ```bash
   cp streamlit_app/.streamlit/secrets.toml.example streamlit_app/.streamlit/secrets.toml
   ```
   
   Edit `streamlit_app/.streamlit/secrets.toml` with your credentials:
   ```toml
   [database]
   url = "postgresql://user:password@host/dbname?sslmode=require"

   [admin]
   username = "your_admin_username"
   password_hash = "$2b$12$..."  # See below for generation
   ```

5. **Generate admin password hash**
   ```bash
   python -c "import bcrypt; print(bcrypt.hashpw(b'YourPassword', bcrypt.gensalt(12)).decode())"
   ```
   Copy the output to the `password_hash` field in `secrets.toml`

6. **Run the application**
   ```bash
   streamlit run streamlit_app/app.py
   ```

7. **Access the application**
   - Participant interface: http://localhost:8501
   - Admin panel: Click "Admin Login" in the sidebar

## Database Schema

### Sessions Table
Stores participant session metadata and aggregate metrics.

| Field | Type | Description |
|-------|------|-------------|
| session_id | UUID | Primary key |
| participant_id | VARCHAR | Anonymous participant identifier |
| started_at | TIMESTAMP | Session start time |
| completed_at | TIMESTAMP | Session completion time |
| mean_rt_block1 | FLOAT | Mean reaction time for Block 1 (ms) |
| mean_rt_block2 | FLOAT | Mean reaction time for Block 2 (ms) |
| mean_rt_block3 | FLOAT | Mean reaction time for Block 3 (ms) |
| overall_mean_rt | FLOAT | Overall mean reaction time (ms) |
| time_constraint_ms | FLOAT | Time constraint used in Block 3 (ms) |
| accuracy_block1 | FLOAT | Accuracy percentage for Block 1 |
| accuracy_block2 | FLOAT | Accuracy percentage for Block 2 |
| accuracy_block3 | FLOAT | Accuracy percentage for Block 3 |
| missed_count_block3 | INT | Number of missed trials in Block 3 |

### Trials Table
Stores individual trial data.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| session_id | UUID | Foreign key to sessions |
| participant_id | VARCHAR | Participant identifier |
| created_at | TIMESTAMP | Trial timestamp |
| block_number | INT | Block number (1-3) |
| block_type | VARCHAR | Block type (congruent/incongruent/stress) |
| trial_number | INT | Trial number within block (1-20) |
| word_shown | VARCHAR | Word displayed (RED/BLUE/GREEN/YELLOW) |
| ink_color | VARCHAR | Ink color (RED/BLUE/GREEN/YELLOW) |
| user_response | VARCHAR | User's response or NULL |
| outcome | VARCHAR | Trial outcome (correct/wrong/missed) |
| reaction_time_ms | INT | Reaction time in milliseconds |

### Settings Table
Stores configurable test parameters.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| time_reduction_ms | INT | Time reduction for Block 3 (default: 120ms) |
| updated_at | TIMESTAMP | Last update timestamp |
| updated_by | VARCHAR | Who updated the setting |

## Configuration

### Time Constraint Setting

The Block 3 time constraint is calculated as:
```
Block 3 Time Limit = max(200ms, Block 2 Mean RT - Time Reduction)
```

To configure the time reduction:
1. Log in to the admin panel
2. Navigate to Settings
3. Adjust the "Time Reduction (ms)" value
4. Click "Save"

Default: 120ms

## Project Structure

```
StroopWillow/
├── streamlit_app/
│   ├── .streamlit/
│   │   ├── config.toml           # Streamlit configuration
│   │   ├── secrets.toml          # Credentials (DO NOT COMMIT)
│   │   └── secrets.toml.example  # Template for secrets
│   ├── stroop_component/
│   │   └── index.html            # Test interface HTML/JS
│   ├── app.py                    # Main Streamlit application
│   ├── db.py                     # Database utilities
│   └── requirements.txt          # Python dependencies
├── .kiro/                        # Development specs
├── .gitignore
└── README.md
```

## Security Features

- **Bcrypt password hashing** for admin credentials
- **Secrets management** via Streamlit secrets.toml (not committed to git)
- **Input validation** on all database operations
- **UUID-based** anonymous participant tracking
- **PostgreSQL parameterized queries** to prevent SQL injection
- **HTTPS recommended** for production deployment

## Data Export

The admin panel provides CSV export with two sections:

1. **Section 1: Trial-Level Data**
   - Individual trial records with all fields
   - Includes session ID, participant ID, timestamps, stimuli, responses, outcomes, and reaction times

2. **Section 2: Per-Participant Summary Statistics**
   - Mean reaction times per block
   - Reaction speed (1/RT) per block
   - Accuracy percentages per block
   - Missed trial counts
   - Time constraint used

## Deployment

### Streamlit Cloud (Recommended)

1. Push your code to GitHub (ensure secrets.toml is in .gitignore)
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repository
4. Add secrets in the Streamlit Cloud dashboard:
   - Go to App Settings → Secrets
   - Paste your secrets.toml content
5. Deploy

### Self-Hosted

```bash
# Install dependencies
pip install -r streamlit_app/requirements.txt

# Run with custom port
streamlit run streamlit_app/app.py --server.port 8501

# Run in production mode
streamlit run streamlit_app/app.py --server.headless true
```

For production, consider using:
- **Nginx** as reverse proxy
- **Supervisor** or **systemd** for process management
- **SSL certificate** (Let's Encrypt)

## Troubleshooting

### Database Connection Issues
- Verify database URL in secrets.toml
- Check database is accessible from your network
- Ensure SSL mode is configured correctly
- Test connection: `psql "your-connection-string"`

### Admin Login Fails
- Verify password_hash matches your password
- Regenerate hash if needed
- Check secrets.toml is loaded correctly

### Port Already in Use
```bash
# Change port
streamlit run streamlit_app/app.py --server.port 8502
```

### Streamlit Secrets Not Loading
- Ensure secrets.toml is in streamlit_app/.streamlit/
- Check file permissions
- Restart Streamlit server

## Research Ethics

This application is designed for research purposes. Before collecting participant data:
- Obtain appropriate ethical approval from your institution
- Ensure informed consent procedures are followed
- Comply with data protection regulations (GDPR, HIPAA, etc.)
- Store data securely and anonymously

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues or questions:
- Open an issue on GitHub
- Contact the research team
- Check Streamlit documentation: https://docs.streamlit.io

## Version History

### v2.0.0 (Current - Streamlit)
- Migrated from Next.js to Streamlit
- Simplified deployment and setup
- Enhanced admin dashboard
- Improved theme support (light/dark)
- Better mobile responsiveness

### v1.0.0 (Legacy - Next.js)
- Initial Next.js implementation
- Three-block Stroop test
- Admin panel with JWT authentication
- CSV export functionality

## License

This project is for research and educational purposes. Please ensure appropriate ethical approval before use.
