# Stroop Test Research Application

A web-based implementation of the Stroop cognitive interference test for research purposes. Built with Next.js 16, React 19, TypeScript, and PostgreSQL.

## 🎯 Overview

This application implements a three-block Stroop test:
- **Block 1**: Congruent trials (word matches ink color)
- **Block 2**: Incongruent trials (word does not match ink color)
- **Block 3**: Time-constrained incongruent trials (adaptive time limit based on Block 2 performance)

## ✨ Features

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
- Secure JWT-based authentication
- Session data dashboard with filtering
- Configurable time constraint settings
- CSV data export (trial-level and summary statistics)
- Date range filtering
- Real-time statistics

### Technical Features
- PostgreSQL database with Prisma ORM
- Anonymous participant tracking (UUID-based)
- Comprehensive input validation
- Rate limiting on sensitive endpoints
- Environment variable validation
- Responsive design
- Accessibility features (ARIA labels)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (or Neon serverless Postgres)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stroop-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   DIRECT_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   
   # Admin credentials
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD_HASH="$2b$12$..." # Generate with: node -e "console.log(require('bcryptjs').hashSync('YourPassword', 12))"
   
   # JWT secret (generate a random string)
   JWT_SECRET="your-secure-random-string-here"
   ```

4. **Generate admin password hash**
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourPassword', 12))"
   ```
   Copy the output to `ADMIN_PASSWORD_HASH` in `.env.local`

5. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**
   - Participant interface: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/login

## 📊 Database Schema

### Sessions Table
Stores participant session metadata and aggregate metrics.

| Field | Type | Description |
|-------|------|-------------|
| session_id | UUID | Primary key |
| participant_id | UUID | Anonymous participant identifier |
| started_at | DateTime | Session start time |
| completed_at | DateTime | Session completion time |
| mean_rt_block1 | Float | Mean reaction time for Block 1 |
| mean_rt_block2 | Float | Mean reaction time for Block 2 |
| mean_rt_block3 | Float | Mean reaction time for Block 3 |
| overall_mean_rt | Float | Overall mean reaction time |
| time_constraint_ms | Float | Time constraint used in Block 3 |
| accuracy_block1 | Float | Accuracy percentage for Block 1 |
| accuracy_block2 | Float | Accuracy percentage for Block 2 |
| accuracy_block3 | Float | Accuracy percentage for Block 3 |
| missed_count_block3 | Int | Number of missed trials in Block 3 |

### Trials Table
Stores individual trial data.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| session_id | UUID | Foreign key to sessions |
| participant_id | UUID | Participant identifier |
| created_at | DateTime | Trial timestamp |
| block_number | Int | Block number (1-3) |
| block_type | String | Block type (congruent/incongruent/stress) |
| trial_number | Int | Trial number within block (1-20) |
| word_shown | String | Word displayed (RED/BLUE/GREEN/YELLOW) |
| ink_color | String | Ink color (RED/BLUE/GREEN/YELLOW) |
| user_response | String | User's response (RED/BLUE/GREEN/YELLOW or null) |
| outcome | String | Trial outcome (correct/wrong/missed) |
| reaction_time_ms | Int | Reaction time in milliseconds |

### Settings Table
Stores configurable test parameters.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| time_reduction_ms | Int | Time reduction for Block 3 (default: 120ms) |
| updated_at | DateTime | Last update timestamp |
| updated_by | String | Who updated the setting |

## 🔧 Configuration

### Time Constraint Setting

The Block 3 time constraint is calculated as:
```
Block 3 Time Limit = max(100ms, Block 2 Mean RT - Time Reduction)
```

To configure the time reduction:
1. Log in to the admin panel
2. Navigate to Settings
3. Adjust the "Time Reduction" value
4. Click "Save Settings"

Default: 120ms

## 📁 Project Structure

```
stroop-app/
├── app/
│   ├── admin/              # Admin panel pages
│   │   ├── login/          # Admin login
│   │   ├── settings/       # Settings configuration
│   │   └── page.tsx        # Dashboard
│   ├── api/                # API routes
│   │   ├── admin/          # Admin endpoints
│   │   ├── sessions/       # Session management
│   │   ├── settings/       # Settings endpoints
│   │   └── trials/         # Trial data endpoints
│   ├── done/               # Completion page
│   ├── instructions/       # Test instructions
│   ├── test/               # Test execution
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Consent page
├── lib/
│   ├── auth.ts             # Authentication utilities
│   ├── db.ts               # Database client
│   ├── env.ts              # Environment validation
│   ├── rate-limit.ts       # Rate limiting
│   └── stroop.ts           # Test logic
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.local              # Environment variables (create this)
├── DEPLOYMENT.md           # Deployment guide
├── TESTING.md              # Testing guide
└── package.json
```

## 🔒 Security Features

- **JWT-based authentication** with 30-minute session expiry
- **Bcrypt password hashing** for admin credentials
- **Rate limiting** on sensitive endpoints:
  - Login: 5 attempts per 15 minutes
  - Data export: 5 requests per minute
  - General API: 60 requests per minute
- **Input validation** on all API endpoints
- **Environment variable validation** at startup
- **UUID validation** for session/participant IDs
- **HTTPS recommended** for production

## 📤 Data Export

The admin panel provides CSV export with two sections:

1. **Trial-Level Data**: Individual trial records with all fields
2. **Summary Statistics**: Per-participant aggregate metrics including:
   - Mean reaction times per block
   - Reaction speed (1/RT) per block
   - Accuracy percentages
   - Missed trial counts
   - Time constraint used

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

See [TESTING.md](./TESTING.md) for testing guidelines and procedures.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from your network
- Ensure SSL mode is configured correctly

### Admin Login Fails
- Verify `ADMIN_PASSWORD_HASH` matches your password
- Check `JWT_SECRET` is set
- Clear browser cookies and try again

### Prisma Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

## 📝 License

This project is for research purposes. Please ensure you have appropriate ethical approval before collecting participant data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

For issues or questions, please open an issue on GitHub or contact the research team.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Three-block Stroop test implementation
- Admin panel with data export
- Configurable time constraint settings
- Rate limiting and security features
- Comprehensive documentation
