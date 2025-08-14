# OBS Telegram Bot - Setup & Deployment Guide

This guide will walk you through setting up the database with Supabase and deploying the OBS Telegram Bot to Vercel.

## Prerequisites

- Node.js 18+ installed
- Telegram Bot Token from @BotFather
- OBS Studio with WebSocket server enabled
- Vercel account
- GitHub account
- Supabase account

## Step 1: Database Setup with Supabase

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up
2. Create a new organization (or use existing)
3. Click "New Project" to create a new database
4. Fill in project details:
   - **Project Name**: `obs-telegram-bot` (or your preferred name)
   - **Database Password**: Use a strong password (save it for later)
   - **Region**: Choose the region closest to your users
5. Click "Create new project" (this may take 2-3 minutes)

### 1.2 Get Database Connection String

1. Once your project is created, go to Project Settings
2. Click on "Database" in the left sidebar
3. Under "Connection string", find the "URI" connection string
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres`)

### 1.3 Set up Environment Variables

Create a `.env` file in your project root:

```bash
# Database (get from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"

# Optional: For local development
# DATABASE_URL="file:./dev.db"
```

### 1.4 Install Prisma CLI and Dependencies

```bash
# Install Prisma CLI globally
npm install -g prisma

# Install project dependencies
npm install
```

### 1.5 Configure Prisma for Supabase

The Prisma schema is already configured for PostgreSQL, but let's verify:

```bash
# Check the current schema
cat prisma/schema.prisma
```

Ensure the datasource is configured for PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.6 Generate Prisma Client and Push Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase database
npm run db:push
```

### 1.7 Verify Database Setup

```bash
# Open Prisma Studio to view database
npx prisma studio
```

You should see all the tables created in your Supabase database.

### 1.8 Set up Supabase Security (Optional but Recommended)

1. Go to your Supabase project dashboard
2. Click on "Authentication" in the left sidebar
3. Configure site URL and redirect URLs if needed
4. Set up Row Level Security (RLS) if you want additional security layers

## Step 2: Local Development

### 2.1 Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 2.2 Configure OBS Studio

1. Open OBS Studio
2. Go to `Tools` → `WebSocket Server Settings`
3. Enable WebSocket server
4. Set port to `4455` (default)
5. Set a password (recommended for security)
6. Click "Apply" and "OK"

### 2.3 Test Bot Configuration

1. Open `http://localhost:3000` in your browser
2. Go to the "Bot Configuration" tab
3. Enter your Telegram bot token
4. Click "Save Bot Token"
5. Go to the "OBS Connections" tab
6. Add your OBS connection details
7. Test the connection

### 2.4 Test Telegram Bot

1. Find your bot on Telegram
2. Send `/start` to begin
3. Use `/help` to see available commands
4. Test commands like `/connect`, `/scenes`, `/stream start`

## Step 3: Production Database Setup with Supabase

### 3.1 Create Production Database (Optional)

If you want a separate production database:

1. Create a new Supabase project for production
2. Get the production database connection string
3. Update your Vercel environment variables with the production URL

### 3.2 Database Migrations

For production deployments, you might want to use migrations instead of `db:push`:

```bash
# Create initial migration
npx prisma migrate dev --name init

# For production
npx prisma migrate deploy
```

### 3.3 Backup Strategy

Supabase automatically handles backups, but you can:

1. Go to your Supabase project dashboard
2. Click on "Database" → "Backups"
3. Configure scheduled backups if needed
4. Set up point-in-time recovery

## Step 4: GitHub Setup

### 4.1 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: OBS Telegram Bot"
```

### 4.2 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Create a new repository named `obs-telegram`
3. Follow the instructions to push your local repository

### 4.3 Push to GitHub

```bash
git remote add origin https://github.com/shihan84/obs-telegram.git
git branch -M main
git push -u origin main
```

## Step 5: Vercel Deployment

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 5.2 Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- Link to your existing project or create new one
- Connect to your GitHub repository
- Configure environment variables

### 5.3 Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add the following variables:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 5.4 Configure Vercel Settings

1. In your Vercel project, go to "Settings"
2. Under "Build & Development":
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 5.5 Redeploy

After setting environment variables, trigger a redeploy:

```bash
vercel --prod
```

## Step 6: Production Configuration

### 6.1 Update Bot Webhook (Optional)

For better reliability, set up a webhook:

```bash
# Get your Vercel deployment URL
YOUR_VERCEL_URL="https://your-app.vercel.app"

# Set webhook (you'll need to implement webhook endpoint)
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=${YOUR_VERCEL_URL}/api/webhook"
```

### 6.2 Security Considerations

1. **Environment Variables**: Never commit sensitive data to git
2. **Database Password**: Use strong passwords for Supabase
3. **OBS WebSocket**: Use password protection for OBS WebSocket
4. **Supabase RLS**: Consider enabling Row Level Security
5. **Rate Limiting**: Consider implementing rate limiting for bot commands

### 6.3 Monitoring with Supabase

1. Go to your Supabase project dashboard
2. Use the built-in analytics and monitoring tools
3. Monitor database performance and usage
4. Set up alerts for unusual activity

## Step 7: Testing Production Deployment

### 7.1 Verify Web Interface

1. Visit your Vercel deployment URL
2. Test all tabs and functionality
3. Verify bot configuration and OBS connections

### 7.2 Test Telegram Bot

1. Send test commands to your bot
2. Verify OBS control functionality
3. Test all available commands

### 7.3 Check Logs

1. Go to Vercel dashboard
2. View function logs for any errors
3. Check Supabase logs for database issues

## Step 8: Supabase Specific Features (Optional)

### 8.1 Enable Real-time Subscriptions

Supabase supports real-time subscriptions. You can enable this for:

```sql
-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE telegram_users;
ALTER PUBLICATION supabase_realtime ADD TABLE obs_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE command_histories;
```

### 8.2 Set up Storage (Optional)

If you need to store files (like screenshots or recordings):

1. Go to Supabase dashboard
2. Click on "Storage"
3. Create a new bucket for your files
4. Configure storage policies

### 8.3 Use Supabase Auth (Optional)

If you want to add user authentication to your web interface:

1. Go to Supabase dashboard
2. Click on "Authentication"
3. Configure authentication providers
4. Update your Next.js app to use Supabase Auth

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify DATABASE_URL is correct and includes the password
- Check Supabase project status
- Ensure SSL is enabled (Supabase requires SSL)
- Verify your IP is not blocked

**Bot Not Responding**
- Verify TELEGRAM_BOT_TOKEN is correct
- Check bot is not blocked by Telegram
- Verify Vercel functions are deployed correctly
- Check environment variables in Vercel

**OBS Connection Issues**
- Verify OBS WebSocket server is running
- Check firewall settings
- Verify connection details (host, port, password)
- Ensure OBS and server are on the same network or use port forwarding

**Deployment Issues**
- Check build logs in Vercel
- Verify all dependencies are installed
- Ensure environment variables are set correctly
- Check Prisma schema compatibility

### Supabase Specific Issues

**Connection Pool Exhausted**
- Enable connection pooling in Supabase
- Optimize database queries
- Consider using connection pooling in your application

**Performance Issues**
- Use Supabase's built-in analytics
- Optimize database queries
- Add proper indexing
- Consider using edge functions for better performance

### Getting Help

1. Check Vercel logs for deployment errors
2. Review Supabase documentation for database issues
3. Consult Telegram Bot API documentation
4. Check OBS WebSocket documentation
5. Visit Supabase Discord community for support

## Maintenance

### Regular Updates

1. Keep dependencies updated: `npm update`
2. Monitor security vulnerabilities: `npm audit`
3. Supabase automatically handles database maintenance
4. Update bot features as needed

### Backup and Recovery

1. Supabase provides automatic backups
2. Configure point-in-time recovery if needed
3. Regularly export your data for additional safety
4. Test recovery procedures periodically

### Scaling Considerations

1. Monitor Supabase database performance
2. Use Supabase's built-in caching
3. Implement proper error handling
4. Add logging and monitoring
5. Consider using Supabase edge functions for global deployment

---

This setup guide should help you get your OBS Telegram Bot running in production with Supabase. The combination of Supabase and Vercel provides a scalable, serverless solution with excellent developer experience and built-in monitoring capabilities.