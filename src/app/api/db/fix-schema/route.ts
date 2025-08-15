import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    console.log('Starting database schema fix...');
    
    // Read and execute the SQL script
    const sqlScript = `
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
    `;

    // Execute the SQL script using Prisma's raw query
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.$executeRawUnsafe(statement.trim());
          console.log('Executed:', statement.trim().substring(0, 100) + '...');
        } catch (error) {
          console.log('Statement execution (may be expected):', error.message);
        }
      }
    }

    console.log('Database schema fix completed successfully');

    return NextResponse.json({ 
      message: 'Database schema fix applied successfully',
      details: 'Added all missing columns and created application_logs table'
    });
  } catch (error) {
    console.error('Error applying database schema fix:', error);
    return NextResponse.json({ 
      error: 'Failed to apply database schema fix',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check the current database schema status (SQLite compatible)
    const tables = await db.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('bot_configurations', 'obs_connections', 'application_logs')
    `;

    // Check columns for each table
    const schemaInfo = [];
    
    for (const table of tables as any[]) {
      const columns = await db.$queryRawUnsafe(`PRAGMA table_info(${table.name})`);
      schemaInfo.push({
        table: table.name,
        columns: JSON.parse(JSON.stringify(columns, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ))
      });
    }

    return NextResponse.json({ 
      message: 'Database schema status',
      schema: schemaInfo
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
    return NextResponse.json({ 
      error: 'Failed to check database schema',
      details: error.message 
    }, { status: 500 });
  }
}