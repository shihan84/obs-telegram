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

-- Optional: If you want to reset any existing data that might be causing conflicts
-- Uncomment the following lines if needed:
-- TRUNCATE bot_configurations RESTART IDENTITY CASCADE;
-- TRUNCATE obs_connections RESTART IDENTITY CASCADE;