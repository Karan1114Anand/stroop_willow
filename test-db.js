require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

// PrismaNeon takes a PoolConfig, not a Pool instance
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma.session.count()
  .then(n => { console.log('✅ Session count:', n); })
  .catch(e => { console.error('❌ DB Error:', e.message.slice(0, 300)); })
  .finally(() => { prisma.$disconnect(); });
