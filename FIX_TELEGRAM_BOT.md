# Telegram Bot Fix Plan for Vercel Deployment

## 🚨 Current Issues Identified

1. **Database Connection Issues**: Prisma prepared statement conflicts in serverless environment
2. **Bot Configuration**: Cannot save/retrieve bot token from database
3. **Vercel Environment**: Serverless function cold starts affecting connections

## 🔧 Immediate Fixes Required

### Phase 1: Database Configuration Fix
- [x] Update Prisma configuration for serverless
- [x] Add connection pooling settings
- [x] Add retry mechanism for prepared statement conflicts

### Phase 2: Create Fallback Endpoints
- [x] Create `/api/bot/setup-manual` - Direct bot setup
- [x] Create `/api/bot/health` - Health check endpoint
- [x] Create `/api/bot/config-direct` - Direct configuration

### Phase 3: Environment Variables Check
- [ ] Verify `TELEGRAM_BOT_TOKEN` is set in Vercel
- [ ] Verify `POSTGRES_URL` uses connection pooling
- [ ] Verify all required environment variables

## 🚀 Quick Fix Commands

### 1. Test Bot Health
```bash
curl https://obs-telegram.vercel.app/api/bot/health
```

### 2. Configure Bot Token
```bash
curl -X POST https://obs-telegram.vercel.app/api/bot/setup-manual \
  -H "Content-Type: application/json" \
  -d '{"bot_token": "YOUR_BOT_TOKEN_HERE"}'
```

### 3. Check Bot Status
```bash
curl https://obs-telegram.vercel.app/api/bot/setup-manual
```

## 📋 Environment Variables Required

### Vercel Environment Variables:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
POSTGRES_URL=postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL=postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 🔍 Testing Steps

1. **Test Database Connection**
   - Check `/api/bot/health` endpoint
   - Verify database connectivity

2. **Configure Bot**
   - Use `/api/bot/setup-manual` with your bot token
   - Verify configuration is saved

3. **Test Bot Functionality**
   - Send `/start` to your bot
   - Verify bot responds

4. **Test OBS Integration**
   - Use `/connect` command
   - Verify OBS connection

## 🛠️ Manual Database Fix

If automatic fixes don't work, run these SQL commands in Supabase:

```sql
-- Ensure bot_configurations table exists
CREATE TABLE IF NOT EXISTS bot_configurations (
  id SERIAL PRIMARY KEY,
  bot_token VARCHAR(255) UNIQUE NOT NULL,
  bot_username VARCHAR(255),
  webhook_url VARCHAR(500),
  is_webhook_enabled BOOLEAN DEFAULT false,
  welcome_message TEXT DEFAULT 'Welcome to OBS Control Bot!',
  admin_only_commands BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert bot token
INSERT INTO bot_configurations (bot_token, bot_username) 
VALUES ('YOUR_BOT_TOKEN_HERE', 'OBSControlBot')
ON CONFLICT (bot_token) DO UPDATE 
SET bot_username = 'OBSControlBot',
    updated_at = NOW();
```

## 📞 Support Commands

### Check Bot Configuration:
```bash
curl https://obs-telegram.vercel.app/api/bot/config-check
```

### Test Database:
```bash
curl https://obs-telegram.vercel.app/api/db-check
```

### Get Diagnostics:
```bash
curl https://obs-telegram.vercel.app/api/diagnostics
```

## ✅ Expected Results After Fix

1. **Bot responds to commands** (`/start`, `/help`, etc.)
2. **Database saves configuration** properly
3. **OBS connections** can be saved and retrieved
4. **All endpoints** return 200 status
5. **No more prepared statement conflicts**

## 🚨 Troubleshooting

If issues persist:

1. **Check Vercel logs** for specific errors
2. **Verify bot token** is valid and from @BotFather
3. **Check database connection** in Supabase dashboard
4. **Test locally** before deploying

## 🎯 Next Steps

1. **Deploy fixes** to Vercel
2. **Test bot configuration** via API
3. **Verify Telegram bot** responds to commands
4. **Test OBS integration** works properly
