# Vercel Database Connection Fix Guide

## Problem Analysis

The diagnostics show that your OBS Telegram Bot application cannot connect to the PostgreSQL database. The error indicates:

```
Can't reach database server at `aws-0-ap-south-1.pooler.supabase.com:6543`
```

This means the DATABASE_URL environment variable in Vercel needs to be corrected.

## Solution: Update Vercel Environment Variables

### Step 1: Get Your Correct Supabase Connection String

You need to update your DATABASE_URL in Vercel to use the correct format. Based on your Supabase project ID `omxmgdmzdukhlnceqock`, here are the correct formats:

#### **Option A: Direct Connection (Recommended for Vercel)**
```
postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

#### **Option B: Alternative Direct Connection**
```
postgresql://postgres.omxmgdmzdukhlnceqock:wJxY2fQO2foE96MQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to [vercel.com](https://vercel.com)
   - Select your `obs-telegram` project

2. **Access Environment Variables**
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Update DATABASE_URL**
   - Find the `DATABASE_URL` variable
   - Click the edit button (pencil icon)
   - **Replace the entire value** with one of the connection strings above
   - **Important**: Use **Option A** first, if that doesn't work, try **Option B**

4. **Save and Redeploy**
   - Click **Save**
   - Vercel will automatically redeploy your application
   - Wait 5-10 minutes for the deployment to complete

### Step 3: Verify the Fix

After the redeployment is complete, test your application:

1. **Run Diagnostics**
   ```
   https://obs-telegram.vercel.app/api/diagnostics
   ```

2. **Expected Result**
   You should see:
   ```json
   {
     "database": {
       "connected": true,
       "error": null,
       "tables": {
         "telegram_users": "OK",
         "bot_configurations": "OK",
         "obs_connections": "OK",
         "scenes": "OK",
         "sources": "OK",
         "command_histories": "OK",
         "stream_sessions": "OK"
       }
     }
   }
   ```

## Troubleshooting

### If Still Not Connected

1. **Check Supabase Project Settings**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **Database**
   - Verify **Connection pooling** is enabled
   - Check your database password is correct

2. **Test Connection Locally**
   You can test the connection string locally:
   ```bash
   # Install psql if not already installed
   # On Ubuntu/Debian:
   sudo apt-get install postgresql-client
   
   # Test connection
   psql "postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
   ```

3. **Alternative Connection String**
   If the above doesn't work, try this format:
   ```
   postgres://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
   (Note: `postgres://` instead of `postgresql://`)

### Common Issues

1. **Password Incorrect**
   - Double-check your Supabase database password
   - You can find it in Supabase Dashboard → Settings → Database

2. **IP Whitelisting**
   - Vercel IPs should be automatically whitelisted by Supabase
   - If issues persist, you may need to add Vercel IPs to your Supabase project

3. **SSL Mode**
   - The connection string includes `sslmode=require` which is necessary for Vercel
   - Don't remove this parameter

## Next Steps After Fix

Once the database connection is working:

1. **Configure Your Bot**
   - Set your Telegram Bot Token in the application
   - Test the bot connection

2. **Add OBS Connections**
   - Add your OBS server details
   - Test the OBS connection

3. **Test All Features**
   - Use the diagnostics page to verify all components are working
   - Test Telegram commands
   - Test OBS controls

## Support

If you continue to have issues:
1. Check Vercel deployment logs for specific error messages
2. Verify your Supabase project is active and accessible
3. Ensure your Vercel plan supports external database connections

---

**Remember**: After updating the environment variables, wait for Vercel to complete the redeployment before testing the connection.