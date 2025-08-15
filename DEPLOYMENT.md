# Vercel Deployment Guide

## Overview
This guide will help you deploy your OBS Telegram Bot to Vercel with proper database configuration.

## Prerequisites

1. **GitHub Repository**: Your code is already pushed to `https://github.com/shihan84/obs-telegram.git`
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Database**: Set up your Supabase project and database schema (see `SUPABASE_SETUP.md`)

## Step 1: Connect to Vercel

### Option A: Import from GitHub (Recommended)

1. **Log in to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click **"Add New..."** → **"Project"**
   - Select your `obs-telegram` repository from the list
   - Click **"Import"**

### Option B: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

## Step 2: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Variables

1. **DATABASE_URL**
   - Your Supabase connection string
   - Example: `postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`

2. **NEXT_TELEMETRY_DISABLED**
   - Value: `1`
   - This disables Next.js telemetry

### Optional Variables

3. **NEXTAUTH_URL** (if using authentication)
   - Your deployed Vercel URL
   - Example: `https://obs-telegram.vercel.app`

4. **NEXTAUTH_SECRET** (if using authentication)
   - A random secret string
   - Generate with: `openssl rand -base64 32`

## Step 3: Configure Build Settings

The build settings are already configured in your project:

### package.json
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### vercel.json
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "installCommand": "npm install && npx prisma generate",
  "buildCommand": "npm run build",
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

## Step 4: Deploy

### Automatic Deployment (GitHub Integration)

1. **Configure Deployment Settings**
   - In Vercel project dashboard, go to **"Settings"** → **"Git"**
   - Ensure **"Automatic Deployment** is enabled
   - Select **"Production"** as the default branch

2. **Trigger Deployment**
   - The deployment should start automatically after importing
   - You can also trigger manual deployment by clicking **"Deploy"**

### Manual Deployment

1. **From Vercel Dashboard**
   - Go to your project
   - Click **"Deployments"** tab
   - Click **"Redeploy"** or **"Deploy"**

2. **From CLI**
   ```bash
   vercel --prod
   ```

## Step 5: Verify Deployment

### Check Build Status

1. **Monitor Build Process**
   - Watch the build logs in Vercel dashboard
   - Look for successful Prisma client generation
   - Ensure Next.js build completes without errors

2. **Check Live Application**
   - Visit your deployed URL (e.g., `https://obs-telegram-yourname.vercel.app`)
   - Verify the web interface loads correctly
   - Test the diagnostics functionality

### Common Issues and Solutions

#### Prisma Client Generation Issues

**Issue**: `Prisma has detected that this project was built on Vercel, which caches dependencies`

**Solution**: 
- Ensure `postinstall` script is in package.json
- Check that `vercel.json` has correct build configuration
- Verify `prisma generate` runs during build

#### Database Connection Issues

**Issue**: Database connection fails after deployment

**Solution**:
- Verify `DATABASE_URL` environment variable is correct
- Ensure Supabase project is active and accessible
- Check SSL mode settings in connection string
- Test connection locally with the same credentials

#### Build Timeouts

**Issue**: Build process times out

**Solution**:
- Optimize dependencies
- Consider using Vercel's build caching
- Split large operations if needed

## Step 6: Post-Deployment Setup

### 1. Configure Telegram Bot

1. **Access Web Interface**
   - Go to your deployed Vercel URL
   - Navigate to **"Bot Configuration"** tab

2. **Set Up Bot Token**
   - Enter your Telegram bot token
   - Save the configuration

### 2. Set Up OBS Connections

1. **Add OBS Connection**
   - Go to **"OBS Connections"** tab
   - Add your OBS server details
   - Test connection using diagnostics

### 3. Test Functionality

1. **Test Bot Commands**
   - Send test commands to your Telegram bot
   - Verify OBS control functionality

2. **Test Web Interface**
   - Test all tabs and features
   - Verify diagnostics work correctly

## Step 7: Monitor and Maintain

### Monitoring

1. **Vercel Analytics**
   - Monitor performance metrics
   - Check error rates and response times

2. **Logs**
   - Access deployment logs in Vercel dashboard
   - Monitor for errors and warnings

### Updates

1. **Automatic Updates**
   - Push changes to GitHub main branch
   - Vercel will automatically redeploy

2. **Manual Updates**
   - Use Vercel dashboard for manual redeployment
   - Roll back to previous deployments if needed

## Environment Variable Templates

### Development (.env.local)
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
NEXT_TELEMETRY_DISABLED=1
```

### Production (Vercel)
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:6543/postgres?sslmode=require
NEXT_TELEMETRY_DISABLED=1
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_random_secret_here
```

## Troubleshooting Checklist

- [ ] Repository is properly connected to Vercel
- [ ] Environment variables are correctly set
- [ ] Database schema is created in Supabase
- [ ] Prisma client generation is configured
- [ ] Build settings are correct in vercel.json
- [ ] Deployment completes without errors
- [ ] Web interface loads successfully
- [ ] Database connection works
- [ ] Telegram bot configuration is set
- [ ] OBS connections are configured and tested

## Support

If you encounter any issues during deployment:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection locally
4. Review this guide and setup documentation
5. Check GitHub issues or create a new one

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain if needed
3. Set up automated backups
4. Test all features in production environment
5. Document any production-specific configurations

Your OBS Telegram Bot should now be running on Vercel with a proper Supabase database backend!