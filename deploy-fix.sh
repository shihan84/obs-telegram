#!/bin/bash

# Telegram Bot Vercel Deployment Fix Script
echo "🚀 Starting Telegram Bot Vercel Deployment Fix..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 3. Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# 4. Build the application
echo "🏗️ Building application..."
npm run build

# 5. Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"

# 6. Test endpoints
echo "🧪 Testing endpoints..."
echo "Testing health check..."
curl -s https://obs-telegram.vercel.app/api/bot/health | jq .

echo "Testing bot status..."
curl -s https://obs-telegram.vercel.app/api/bot/setup-manual | jq .

echo "🎯 Fix complete! Use the following commands to configure your bot:"
echo "1. Configure bot: curl -X POST https://obs-telegram.vercel.app/api/bot/setup-manual -H 'Content-Type: application/json' -d '{\"bot_token\":\"YOUR_BOT_TOKEN\"}'"
echo "2. Check status: curl https://obs-telegram.vercel.app/api/bot/setup-manual"
echo "3. Health check: curl https://obs-telegram.vercel.app/api/bot/health"
