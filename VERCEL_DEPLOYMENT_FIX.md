# Vercel Deployment Fix Guide

## Problem
OBS connections are not showing on the Vercel deployment at https://obs-telegram.vercel.app/

## Root Cause
The Vercel deployment is not properly configured with the correct database environment variables and schema.

## Solution Steps

### 1. Set Up Environment Variables in Vercel

You need to set these environment variables in your Vercel project:

#### Required Variables:
```
DATABASE_URL=postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
POSTGRES_URL=postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

#### Optional Variables:
```
NEXTAUTH_URL=https://obs-telegram.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. Set Up Environment Variables via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `obs-telegram`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| DATABASE_URL | `postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require` | Production |
| POSTGRES_URL | `postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require` | Production |
| NEXTAUTH_URL | `https://obs-telegram.vercel.app` | Production |
| NEXTAUTH_SECRET | `generate-a-random-secret-key` | Production |

### 3. Set Up Environment Variables via Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

vercel env add POSTGRES_URL production
# Paste: postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

vercel env add NEXTAUTH_URL production
# Paste: https://obs-telegram.vercel.app

vercel env add NEXTAUTH_SECRET production
# Generate a random secret: openssl rand -base64 32
```

### 4. Ensure Database Schema is Set Up

Make sure your Supabase database has the correct schema. If not, run the SQL script from `SUPABASE_SETUP.md` in your Supabase dashboard.

### 5. Redeploy to Vercel

After setting up the environment variables, redeploy your application:

```bash
# Deploy to production
vercel --prod

# Or trigger redeploy from Vercel dashboard
```

### 6. Test the Deployment

After deployment, test these endpoints:

#### Test APIs:
```bash
# Test OBS connections API
curl https://obs-telegram.vercel.app/api/obs/connections

# Test bot status API
curl https://obs-telegram.vercel.app/api/bot/status

# Test database schema
curl https://obs-telegram.vercel.app/api/db/fix-schema
```

#### Expected Responses:
- **OBS Connections**: Should return an array of connections (empty if none configured)
- **Bot Status**: Should return status object with bot configuration info
- **Database Schema**: Should return schema information

### 7. Troubleshooting

If the deployment still doesn't work:

#### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Logs** tab
4. Check for any error messages

#### Common Issues:

**Issue**: Database connection errors
**Solution**: Verify DATABASE_URL and POSTGRES_URL are correct

**Issue**: Prisma schema errors
**Solution**: Ensure database schema is properly set up in Supabase

**Issue**: Environment variables not loaded
**Solution**: Double-check variable names and values in Vercel settings

**Issue**: Build errors
**Solution**: Check the build logs in Vercel dashboard for specific error messages

### 8. Alternative Database URLs

If the current database URL doesn't work, try these alternatives:

```
# Direct connection
DATABASE_URL=postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@db.omxmgdmzdukhlnceqock.supabase.co:5432/postgres?sslmode=require

# Connection pooler with different SSL
DATABASE_URL=postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=no-verify
```

### 9. Verification

After successful deployment, you should be able to:

1. Visit https://obs-telegram.vercel.app/
2. See the OBS Telegram Bot interface
3. Add OBS connections through the web interface
4. Configure bot settings
5. View connection status

### 10. Final Checks

- ✅ Environment variables set in Vercel
- ✅ Database schema created in Supabase
- ✅ Application deployed successfully
- ✅ APIs responding correctly
- ✅ Web interface loading properly

## Support

If you encounter any issues during the deployment process:

1. Check Vercel logs for error messages
2. Verify environment variables are correctly set
3. Ensure database schema is properly configured
4. Test database connectivity separately

The application should work correctly once all environment variables are properly configured and the database schema is set up.