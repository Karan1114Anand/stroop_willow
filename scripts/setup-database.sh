#!/bin/bash

# Stroop Test Database Setup Script
# This script initializes the database and runs migrations

set -e

echo "🔧 Stroop Test Database Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your database credentials."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Push database schema
echo "🗄️  Pushing database schema..."
npx prisma db push
echo "✅ Database schema updated"
echo ""

# Create default settings
echo "⚙️  Creating default settings..."
node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function createSettings() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  
  try {
    const existing = await prisma.settings.findFirst();
    if (!existing) {
      await prisma.settings.create({
        data: {
          time_reduction_ms: 120,
          updated_by: 'system',
        },
      });
      console.log('✅ Default settings created');
    } else {
      console.log('ℹ️  Settings already exist');
    }
  } catch (error) {
    console.error('❌ Error creating settings:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

createSettings();
"
echo ""

echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Visit http://localhost:3000"
echo "3. Admin panel: http://localhost:3000/admin/login"
echo ""
