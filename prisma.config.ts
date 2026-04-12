import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load .env.local (Next.js convention)
config({ path: '.env.local' });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
