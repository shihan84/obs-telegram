import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test bot_configurations table
    const botConfigTest = await db.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bot_configurations' 
      AND column_name IN ('bot_token', 'bot_username')
      ORDER BY column_name
    ` as Array<{column_name: string; data_type: string; is_nullable: string}>;

    // Test obs_connections table
    const obsConfigTest = await db.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'obs_connections' 
      AND column_name IN ('is_connected', 'last_connected_at')
      ORDER BY column_name
    ` as Array<{column_name: string; data_type: string; is_nullable: string}>;

    // Test basic queries
    const botConfigs = await db.botConfiguration.findMany().catch(() => []);
    const obsConnections = await db.oBSConnection.findMany().catch(() => []);

    return NextResponse.json({
      success: true,
      schema: {
        bot_configurations: {
          required_columns: ['bot_token', 'bot_username'],
          existing_columns: botConfigTest.map(col => col.column_name),
          missing_columns: ['bot_token', 'bot_username'].filter(
            col => !botConfigTest.some(existing => existing.column_name === col)
          ),
          all_columns_exist: botConfigTest.length === 2
        },
        obs_connections: {
          required_columns: ['is_connected', 'last_connected_at'],
          existing_columns: obsConfigTest.map(col => col.column_name),
          missing_columns: ['is_connected', 'last_connected_at'].filter(
            col => !obsConfigTest.some(existing => existing.column_name === col)
          ),
          all_columns_exist: obsConfigTest.length === 2
        }
      },
      data: {
        bot_configs_count: Array.isArray(botConfigs) ? botConfigs.length : 'error',
        obs_connections_count: Array.isArray(obsConnections) ? obsConnections.length : 'error'
      },
      ready: botConfigTest.length === 2 && obsConfigTest.length === 2
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      schema: {
        bot_configurations: { all_columns_exist: false },
        obs_connections: { all_columns_exist: false }
      },
      ready: false
    }, { status: 500 });
  }
}