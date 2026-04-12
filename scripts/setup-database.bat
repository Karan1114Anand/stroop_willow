@echo off
REM Stroop Test Database Setup Script (Windows)
REM This script initializes the database and runs migrations

echo.
echo Stroop Test Database Setup
echo ==============================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Error: .env.local file not found!
    echo Please create .env.local with your database credentials.
    exit /b 1
)

echo Environment variables loaded from .env.local
echo.

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo Error generating Prisma Client
    exit /b 1
)
echo Prisma Client generated
echo.

REM Push database schema
echo Pushing database schema...
call npx prisma db push
if errorlevel 1 (
    echo Error pushing database schema
    exit /b 1
)
echo Database schema updated
echo.

REM Create default settings
echo Creating default settings...
node -e "const { PrismaClient } = require('@prisma/client'); const { PrismaNeon } = require('@prisma/adapter-neon'); const { neonConfig } = require('@neondatabase/serverless'); const ws = require('ws'); neonConfig.webSocketConstructor = ws; async function createSettings() { const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL }); const prisma = new PrismaClient({ adapter }); try { const existing = await prisma.settings.findFirst(); if (!existing) { await prisma.settings.create({ data: { time_reduction_ms: 120, updated_by: 'system' } }); console.log('Default settings created'); } else { console.log('Settings already exist'); } } catch (error) { console.error('Error creating settings:', error.message); } finally { await prisma.$disconnect(); } } createSettings();"
echo.

echo Database setup complete!
echo.
echo Next steps:
echo 1. Start the development server: npm run dev
echo 2. Visit http://localhost:3000
echo 3. Admin panel: http://localhost:3000/admin/login
echo.

pause
