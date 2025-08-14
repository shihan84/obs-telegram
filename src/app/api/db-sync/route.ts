import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔄 Starting database schema synchronization...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, string>,
      errors: [] as string[]
    };

    // Check and create tables if they don't exist
    const tables = [
      {
        name: 'telegram_users',
        createQuery: `
          CREATE TABLE IF NOT EXISTS telegram_users (
            id SERIAL PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            is_bot BOOLEAN DEFAULT FALSE,
            is_admin BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'bot_configurations',
        createQuery: `
          CREATE TABLE IF NOT EXISTS bot_configurations (
            id SERIAL PRIMARY KEY,
            bot_token VARCHAR(500) UNIQUE NOT NULL,
            bot_username VARCHAR(255),
            webhook_url VARCHAR(500),
            is_webhook_enabled BOOLEAN DEFAULT FALSE,
            welcome_message TEXT DEFAULT 'Welcome to OBS Control Bot! Use /help to see available commands.',
            admin_only_commands BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'obs_connections',
        createQuery: `
          CREATE TABLE IF NOT EXISTS obs_connections (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            host VARCHAR(255) DEFAULT 'localhost',
            port INTEGER DEFAULT 4455,
            password VARCHAR(255),
            is_connected BOOLEAN DEFAULT FALSE,
            last_connected_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'scenes',
        createQuery: `
          CREATE TABLE IF NOT EXISTS scenes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            scene_id VARCHAR(255),
            obs_connection_id INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE,
            UNIQUE (name, obs_connection_id)
          );
        `
      },
      {
        name: 'sources',
        createQuery: `
          CREATE TABLE IF NOT EXISTS sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            source_id VARCHAR(255),
            source_type VARCHAR(255),
            scene_id INTEGER,
            obs_connection_id INTEGER NOT NULL,
            is_visible BOOLEAN DEFAULT TRUE,
            is_enabled BOOLEAN DEFAULT TRUE,
            muted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE,
            FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL,
            UNIQUE (name, obs_connection_id)
          );
        `
      },
      {
        name: 'command_histories',
        createQuery: `
          CREATE TABLE IF NOT EXISTS command_histories (
            id SERIAL PRIMARY KEY,
            command VARCHAR(255) NOT NULL,
            parameters TEXT,
            response TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            telegram_user_id INTEGER,
            execution_time INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (telegram_user_id) REFERENCES telegram_users(id) ON DELETE SET NULL
          );
        `
      },
      {
        name: 'stream_sessions',
        createQuery: `
          CREATE TABLE IF NOT EXISTS stream_sessions (
            id SERIAL PRIMARY KEY,
            stream_key VARCHAR(500),
            stream_url VARCHAR(500),
            is_streaming BOOLEAN DEFAULT FALSE,
            started_at TIMESTAMP,
            ended_at TIMESTAMP,
            duration INTEGER,
            telegram_user_id INTEGER,
            obs_connection_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (telegram_user_id) REFERENCES telegram_users(id) ON DELETE SET NULL,
            FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE
          );
        `
      }
    ];

    // Create tables
    for (const table of tables) {
      try {
        await db.$executeRawUnsafe(table.createQuery);
        results.tables[table.name] = 'Created/Verified';
        console.log(`✅ Table ${table.name} created/verified`);
      } catch (error) {
        const errorMsg = `Error creating table ${table.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Add missing columns if they don't exist
    const columnChecks = [
      {
        table: 'bot_configurations',
        column: 'bot_token',
        type: 'VARCHAR(500)',
        addQuery: `ALTER TABLE bot_configurations ADD COLUMN IF NOT EXISTS bot_token VARCHAR(500) UNIQUE;`
      },
      {
        table: 'obs_connections',
        column: 'is_connected',
        type: 'BOOLEAN',
        addQuery: `ALTER TABLE obs_connections ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE;`
      },
      {
        table: 'obs_connections',
        column: 'last_connected_at',
        type: 'TIMESTAMP',
        addQuery: `ALTER TABLE obs_connections ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP;`
      }
    ];

    // Check and add missing columns
    for (const columnCheck of columnChecks) {
      try {
        await db.$executeRawUnsafe(columnCheck.addQuery);
        console.log(`✅ Column ${columnCheck.table}.${columnCheck.column} added/verified`);
      } catch (error) {
        // Column might already exist, which is fine
        console.log(`ℹ️  Column ${columnCheck.table}.${columnCheck.column} already exists or error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update timestamps for updated_at
    const triggerFunctions = [
      `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      `
    ];

    for (const triggerFunc of triggerFunctions) {
      try {
        await db.$executeRawUnsafe(triggerFunc);
        console.log('✅ Trigger function created/updated');
      } catch (error) {
        console.log(`ℹ️  Trigger function already exists or error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create triggers for tables that have updated_at column
    const tablesWithTriggers = ['telegram_users', 'bot_configurations', 'obs_connections', 'scenes', 'sources', 'stream_sessions'];
    
    for (const tableName of tablesWithTriggers) {
      try {
        await db.$executeRawUnsafe(`
          DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
          CREATE TRIGGER update_${tableName}_updated_at 
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log(`✅ Trigger created for ${tableName}`);
      } catch (error) {
        console.log(`ℹ️  Trigger for ${tableName} already exists or error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('🎉 Database schema synchronization completed!');

    return NextResponse.json({
      success: true,
      message: 'Database schema synchronized successfully',
      results
    });

  } catch (error) {
    console.error('❌ Error synchronizing database schema:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to synchronize database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Please use POST to synchronize database schema',
    endpoint: 'POST /api/db-sync'
  });
}