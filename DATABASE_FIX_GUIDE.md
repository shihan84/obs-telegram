# Database Schema Fix Guide

## Problem
Your OBS Telegram Bot is failing in Vercel due to missing database columns. The error shows:
- `bot_configurations.botToken` column doesn't exist
- `obs_connections.isConnected` column doesn't exist

## Solution
Execute the following SQL commands in your Supabase dashboard to add the missing columns:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Execute the SQL Script
Copy and paste this entire script into the SQL Editor and click "Run":

```sql
-- Fix for OBS Telegram Bot Database Schema
-- This script adds all missing columns that Prisma couldn't sync due to serverless conflicts

-- Add missing columns to bot_configurations table
ALTER TABLE bot_configurations 
ADD COLUMN IF NOT EXISTS bot_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS bot_username VARCHAR(255);

-- Add missing columns to obs_connections table
ALTER TABLE obs_connections 
ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP;

-- Verify the changes by listing the tables
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('bot_configurations', 'obs_connections')
ORDER BY table_name, ordinal_position;
```

### Step 3: Verify the Fix
After running the SQL, check if the fix worked by visiting:
```
https://your-app.vercel.app/api/db-schema-check
```

You should see a response like:
```json
{
  "success": true,
  "schema": {
    "bot_configurations": {
      "all_columns_exist": true,
      "existing_columns": ["bot_token", "bot_username"],
      "missing_columns": []
    },
    "obs_connections": {
      "all_columns_exist": true,
      "existing_columns": ["is_connected", "last_connected_at"],
      "missing_columns": []
    }
  },
  "ready": true
}
```

### Step 4: Test Your Application
Once the schema is fixed, your application should work perfectly. Test:
1. Bot configuration setup
2. OBS connection management
3. Telegram bot commands

## Why This Happened
This issue occurred because:
1. Vercel's serverless environment has connection pooling limitations
2. Prisma's automatic schema sync conflicts with prepared statements in serverless
3. The database schema was incomplete after deployment

## Alternative Method
If the SQL Editor doesn't work, you can also:
1. Use the Supabase CLI: `supabase db push`
2. Use a database client like DBeaver or pgAdmin
3. Contact Supabase support to run the script for you

## Need Help?
If you encounter any issues:
1. Check the SQL execution results for errors
2. Verify you're connected to the correct database
3. Ensure you have the necessary permissions
4. Try running each ALTER TABLE statement separately

After completing these steps, your OBS Telegram Bot will be fully operational!