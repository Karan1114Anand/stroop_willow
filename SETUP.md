# Quick Setup Guide

## Prerequisites
- Python 3.8 or higher
- PostgreSQL database (Neon recommended)
- Git

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd StroopWillow
pip install -r streamlit_app/requirements.txt
```

### 2. Database Setup

Create a PostgreSQL database (or use Neon) and run the schema:

```sql
-- See README.md for complete SQL schema
-- Or use the schema from your existing Neon database
```

### 3. Configure Secrets

```bash
cd streamlit_app/.streamlit
cp secrets.toml.example secrets.toml
```

Edit `secrets.toml`:

```toml
[database]
url = "postgresql://user:password@host/dbname?sslmode=require"

[admin]
username = "your_username"
password_hash = "$2b$12$..."  # Generate below
```

### 4. Generate Password Hash

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'YourPassword', bcrypt.gensalt(12)).decode())"
```

Copy the output to `password_hash` in `secrets.toml`

### 5. Run the App

```bash
streamlit run streamlit_app/app.py
```

Open http://localhost:8501

## Important Security Notes

⚠️ **NEVER commit these files to Git:**
- `streamlit_app/.streamlit/secrets.toml` (contains database credentials and admin password)
- `.env` or `.env.local` files

✅ **These are already in .gitignore** - just make sure you don't force-add them!

## Testing the Setup

1. **Test participant flow:**
   - Go to http://localhost:8501
   - Click "I Agree — Continue"
   - Complete the test

2. **Test admin panel:**
   - Click "Admin Login" in sidebar
   - Enter your username and password
   - Verify you can see the dashboard

## Troubleshooting

### "Connection refused" error
- Check your database URL in secrets.toml
- Verify database is running and accessible

### "Module not found" error
```bash
pip install -r streamlit_app/requirements.txt
```

### Admin login fails
- Regenerate password hash
- Check username matches exactly
- Verify secrets.toml is in the correct location

### Port already in use
```bash
streamlit run streamlit_app/app.py --server.port 8502
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Configure time reduction settings in admin panel
- Set up deployment (see README.md deployment section)
