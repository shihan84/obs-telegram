# Database Schema Synchronization Guide

## 🔄 Fix Missing Database Columns

Your database connection is working, but some columns are missing from the tables. This API endpoint will fix that automatically.

## 🚀 Quick Fix

### **Step 1: Trigger Database Sync**

Visit this URL in your browser or use curl:

```
https://obs-telegram.vercel.app/api/db-sync
```

**Method**: POST (most browsers will show a form, or you can use the curl command below)

### **Step 2: Using curl (Recommended)**

Open your terminal and run:

```bash
curl -X POST https://obs-telegram.vercel.app/api/db-sync
```

### **Step 3: Expected Response**

You should see a response like:

```json
{
  "success": true,
  "message": "Database schema synchronized successfully",
  "results": {
    "timestamp": "2025-01-14T12:30:00.000Z",
    "tables": {
      "telegram_users": "Created/Verified",
      "bot_configurations": "Created/Verified",
      "obs_connections": "Created/Verified",
      "scenes": "Created/Verified",
      "sources": "Created/Verified",
      "command_histories": "Created/Verified",
      "stream_sessions": "Created/Verified"
    },
    "errors": []
  }
}
```

## 🔍 What This Does

The database synchronization will:

1. **Create missing tables** (if they don't exist)
2. **Add missing columns**:
   - `bot_token` column to `bot_configurations` table
   - `is_connected` column to `obs_connections` table
   - `last_connected_at` column to `obs_connections` table
3. **Create triggers** for automatic `updated_at` timestamps
4. **Set up proper relationships** between tables

## 🧪 Test After Sync

### **Step 4: Verify the Fix**

After running the sync, visit the diagnostics page:

```
https://obs-telegram.vercel.app/api/diagnostics
```

**Expected Result**: You should see:
- `"database": {"connected": true, ...}`
- `"bot": {"configured": false, "error": null, ...}` (error should be gone)
- `"obs": {"connections": [], "error": null, ...}` (error should be gone)

### **Step 5: Configure Your Bot**

Once the database schema is fixed, you can:

1. **Set up your bot token** in the application
2. **Test bot connection** using the diagnostics
3. **Add OBS connections** and test them
4. **Use all media control commands**

## 📋 Complete Flow

1. ✅ **Database Connection**: Working
2. 🔄 **Schema Sync**: Run the sync command above
3. ⏳ **Wait for Completion**: Should take 10-30 seconds
4. 🧪 **Test Diagnostics**: Verify no more schema errors
5. 🤖 **Configure Bot**: Add your bot token
6. 🔌 **Add OBS**: Add your OBS server details
7. 🎮 **Test Features**: Try all commands

## 🚨 If You Encounter Errors

### **Error**: "Database connection failed"
- **Solution**: Wait a few minutes and try again
- **Check**: Vercel deployment status

### **Error**: "Permission denied"
- **Solution**: The API should have proper permissions, try again

### **Error**: "Column already exists"
- **Solution**: This is normal, the script handles existing columns

### **Error**: "Table already exists"
- **Solution**: This is normal, the script checks for existing tables

## 🎯 Next Steps After Sync

Once the database schema is synchronized:

1. **Bot Configuration**:
   - Add your Telegram bot token
   - Test bot API connection

2. **OBS Setup**:
   - Add your OBS server details
   - Test OBS WebSocket connection

3. **Feature Testing**:
   - Test all media commands: `/play`, `/pause`, `/restart`, `/stopmedia`, `/next`, `/previous`, `/mediastatus`
   - Verify scene and source control
   - Test stream recording functionality

## 📞 Support

If you encounter any issues:
1. Check the response from the sync API for specific errors
2. Verify your Vercel deployment is complete
3. Ensure all environment variables are correctly set
4. Check the diagnostics page for detailed status

---

**🚀 Run the sync command now to fix your database schema!**