import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { validateEnv } from './env';

// Validate environment variables
validateEnv();

// Required for PrismaNeon to use WebSocket in Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClient | undefined;
};

function prismaClientSingleton() {
  const connectionString = process.env.DATABASE_URL!;
  // PrismaNeon takes a Pool config object (not a Pool instance)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaGlobal = prisma;
}
