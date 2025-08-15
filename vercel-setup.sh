#!/bin/bash

# Vercel Deployment Setup Script for OBS Telegram Bot
# This script helps set up the required environment variables for Vercel deployment

echo "🚀 Setting up Vercel deployment for OBS Telegram Bot"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
echo "📋 Checking Vercel login status..."
vercel whoami || {
    echo "❌ Please log in to Vercel first:"
    echo "vercel login"
    exit 1
}

# Set environment variables
echo "⚙️ Setting up environment variables..."

# Database URL
echo "Setting DATABASE_URL..."
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

# Alternative database URL for fallback
echo "Setting POSTGRES_URL..."
vercel env add POSTGRES_URL production
# Paste: postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

# Optional: NextAuth variables (if needed)
echo "Setting NEXTAUTH_URL..."
vercel env add NEXTAUTH_URL production

echo "Setting NEXTAUTH_SECRET..."
vercel env add NEXTAUTH_SECRET production

echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your Supabase database schema is set up"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Test the deployment at https://obs-telegram.vercel.app/"
echo ""
echo "🔍 To test the APIs:"
echo "- OBS Connections: https://obs-telegram.vercel.app/api/obs/connections"
echo "- Bot Status: https://obs-telegram.vercel.app/api/bot/status"
echo "- Database Schema: https://obs-telegram.vercel.app/api/db/fix-schema"