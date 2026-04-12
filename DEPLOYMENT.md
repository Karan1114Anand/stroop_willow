# Deployment Guide

This guide covers deploying the Stroop Test application to production environments.

## Prerequisites

- Node.js 20+ runtime environment
- PostgreSQL database (or Neon serverless Postgres)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Environment Variables

Ensure all required environment variables are set in your production environment:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Admin credentials (required)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$12$..." # Use bcrypt hash

# JWT secret (required - MUST be changed from default)
JWT_SECRET="your-secure-random-string-minimum-32-characters"

# Node environment
NODE_ENV="production"
```

### Generating Secure Secrets

```bash
# Generate admin password hash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword', 12))"

# Generate JWT secret (use a password manager or)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment path for Next.js applications.

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables in the Vercel dashboard
   - Deploy

3. **Configure Database**
   - Ensure your PostgreSQL database is accessible from Vercel's IP ranges
   - For Neon, this is automatic
   - Run migrations: `npx prisma db push` (or use Vercel's build command)

4. **Custom Domain** (optional)
   - Add your domain in Vercel project settings
   - Configure DNS records as instructed

### Option 2: Docker

Deploy using Docker containers for maximum portability.

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package.json package-lock.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Generate Prisma client
   RUN npx prisma generate
   
   # Build Next.js
   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
   COPY --from=builder /app/prisma ./prisma
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"
   
   CMD ["node", "server.js"]
   ```

2. **Update next.config.ts**
   ```typescript
   const nextConfig = {
     output: 'standalone',
   };
   
   export default nextConfig;
   ```

3. **Build and run**
   ```bash
   # Build image
   docker build -t stroop-app .
   
   # Run container
   docker run -p 3000:3000 \
     -e DATABASE_URL="..." \
     -e ADMIN_USERNAME="..." \
     -e ADMIN_PASSWORD_HASH="..." \
     -e JWT_SECRET="..." \
     stroop-app
   ```

4. **Docker Compose** (with database)
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: postgresql://postgres:password@db:5432/stroop
         DIRECT_DATABASE_URL: postgresql://postgres:password@db:5432/stroop
         ADMIN_USERNAME: admin
         ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH}
         JWT_SECRET: ${JWT_SECRET}
       depends_on:
         - db
     
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: stroop
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
   
   volumes:
     postgres_data:
   ```

### Option 3: Traditional VPS/Server

Deploy to a traditional server (AWS EC2, DigitalOcean, etc.).

1. **Server setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx (optional, for reverse proxy)
   sudo apt install -y nginx
   ```

2. **Deploy application**
   ```bash
   # Clone repository
   git clone <your-repo-url> /var/www/stroop-app
   cd /var/www/stroop-app
   
   # Install dependencies
   npm ci --only=production
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "stroop-app" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx** (optional)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Database Setup

### Running Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

### Database Backups

Set up automated backups for your PostgreSQL database:

```bash
# Manual backup
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h hostname -U username -d database_name < backup_20240101.sql
```

For Neon, use their built-in backup features in the dashboard.

## Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] JWT_SECRET is changed from default
- [ ] Database migrations have been run
- [ ] Admin login works
- [ ] Test participant flow works end-to-end
- [ ] CSV export works
- [ ] Settings page works
- [ ] HTTPS is enabled
- [ ] Database backups are configured
- [ ] Monitoring is set up (optional)
- [ ] Error tracking is configured (optional)

## Monitoring & Logging

### Application Logs

```bash
# PM2 logs
pm2 logs stroop-app

# Docker logs
docker logs <container-id>

# Vercel logs
# Available in Vercel dashboard
```

### Error Tracking (Optional)

Consider integrating error tracking services:

- **Sentry**: https://sentry.io
- **LogRocket**: https://logrocket.com
- **Datadog**: https://www.datadoghq.com

Example Sentry integration:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Performance Optimization

### Database Indexing

The schema already includes indexes on frequently queried fields:
- `sessions.started_at`
- `sessions.participant_id`
- `trials.session_id`
- `trials.participant_id`
- `trials.created_at`

### Caching

Consider adding caching for:
- Settings (rarely change)
- Admin dashboard statistics

### CDN

For static assets, consider using a CDN:
- Vercel automatically provides CDN
- For other deployments, use Cloudflare or AWS CloudFront

## Scaling Considerations

### Horizontal Scaling

- Use a load balancer (Nginx, AWS ALB, etc.)
- Ensure database can handle concurrent connections
- Consider connection pooling (PgBouncer)

### Database Scaling

- Monitor query performance
- Add indexes as needed
- Consider read replicas for heavy read workloads
- Use Neon's autoscaling features

## Security Hardening

### Production Checklist

- [ ] HTTPS only (no HTTP)
- [ ] Strong JWT secret (32+ characters)
- [ ] Strong admin password
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Database credentials secured
- [ ] Regular security updates

### Security Headers

Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## Troubleshooting

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Regenerate Prisma client
npx prisma generate
```

### Database Connection Issues

- Check firewall rules
- Verify SSL/TLS settings
- Test connection string manually
- Check database logs

### Performance Issues

- Monitor database query performance
- Check server resources (CPU, memory)
- Review application logs
- Use Next.js built-in analytics

## Rollback Procedure

If deployment fails:

1. **Vercel**: Use the "Rollback" button in dashboard
2. **Docker**: Revert to previous image tag
3. **PM2**: 
   ```bash
   pm2 stop stroop-app
   git checkout <previous-commit>
   npm install
   npm run build
   pm2 restart stroop-app
   ```

## Support

For deployment issues:
- Check application logs
- Review this documentation
- Contact the development team
- Open an issue on GitHub
