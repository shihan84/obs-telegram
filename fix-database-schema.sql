-- Fix for OBS Telegram Bot Database Schema
-- This script adds all missing columns that Prisma couldn't sync due to serverless conflicts
-- Updated to use consistent snake_case naming convention

-- Add missing columns to bot_configurations table
ALTER TABLE bot_configurations 
ADD COLUMN IF NOT EXISTS bot_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS bot_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_webhook_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT 'Welcome to OBS Control Bot! Use /help to see available commands.',
ADD COLUMN IF NOT EXISTS admin_only_commands BOOLEAN DEFAULT TRUE;

-- Add missing columns to obs_connections table
ALTER TABLE obs_connections 
ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP;

-- Add missing columns to scenes table (if needed)
ALTER TABLE scenes 
ADD COLUMN IF NOT EXISTS scene_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Add missing columns to sources table (if needed)
ALTER TABLE sources 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS scene_id INT,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;

-- Add missing columns to command_histories table (if needed)
ALTER TABLE command_histories 
ADD COLUMN IF NOT EXISTS parameters TEXT,
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS execution_time INT;

-- Add missing columns to stream_sessions table (if needed)
ALTER TABLE stream_sessions 
ADD COLUMN IF NOT EXISTS stream_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS stream_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration INT;

-- Create the application_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS application_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'INFO',
    component VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    user_id INT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_component ON application_logs(component);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);

-- Verify the changes by listing the tables
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('bot_configurations', 'obs_connections', 'application_logs')
ORDER BY table_name, ordinal_position;

-- Optional: If you want to reset any existing data that might be causing conflicts
-- Uncomment the following lines if needed:
-- TRUNCATE bot_configurations RESTART IDENTITY CASCADE;
-- TRUNCATE obs_connections RESTART IDENTITY CASCADE;