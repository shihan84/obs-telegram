# Supabase Quick Start Guide

This is a condensed guide for setting up the OBS Telegram Bot with Supabase.

## 🚀 Supabase Setup in 5 Minutes

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project → Name: `obs-telegram-bot`
3. Set strong database password → Create project

### 2. Get Database URL
1. Project Settings → Database
2. Copy "Connection string" → URI format
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### 3. Configure Environment
Create `.env` file:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
TELEGRAM_BOT_TOKEN="your_bot_token"
```

### 4. Setup Database
```bash
npm install
npm run db:generate
npm run db:push
```

### 5. Test Locally
```bash
npm run dev
```
Visit `http://localhost:3000`

## 📱 Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Set Environment Variables in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add:
  - `DATABASE_URL` (your Supabase URL)
  - `TELEGRAM_BOT_TOKEN` (your bot token)

### 4. Redeploy
```bash
vercel --prod
```

## 🎯 Next Steps

1. **Configure OBS Studio**:
   - Tools → WebSocket Server Settings
   - Enable server, port 4455, set password

2. **Test Bot**:
   - Send `/start` to your Telegram bot
   - Use `/connect` to connect to OBS
   - Try `/scenes`, `/stream start`, etc.

3. **Monitor**:
   - Check Supabase dashboard for database stats
   - Monitor Vercel for deployment logs

## 🔧 Common Commands

```bash
# Development
npm run dev

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npx prisma studio      # View database

# Deployment
vercel --prod          # Deploy to production
```

## 📚 Troubleshooting

**Connection Issues**:
- Verify DATABASE_URL includes password
- Check Supabase project status
- Ensure SSL is enabled

**Bot Issues**:
- Verify TELEGRAM_BOT_TOKEN
- Check Vercel environment variables
- Review Vercel function logs

---

That's it! Your OBS Telegram Bot should be running with Supabase in minutes.