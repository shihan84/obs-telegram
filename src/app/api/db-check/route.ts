import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Simple test to check if required columns exist
    const result = await db.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'bot_configurations' 
         AND column_name = 'bot_token') as bot_token_exists,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'bot_configurations' 
         AND column_name = 'bot_username') as bot_username_exists,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'obs_connections' 
         AND column_name = 'is_connected') as is_connected_exists,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'obs_connections' 
         AND column_name = 'last_connected_at') as last_connected_at_exists
    ` as Array<{
      bot_token_exists: number;
      bot_username_exists: number;
      is_connected_exists: number;
      last_connected_at_exists: number;
    }>;

    const [counts] = result;
    
    const allColumnsExist = 
      counts.bot_token_exists > 0 &&
      counts.bot_username_exists > 0 &&
      counts.is_connected_exists > 0 &&
      counts.last_connected_at_exists > 0;

    return NextResponse.json({
      success: true,
      columns: {
        bot_token: counts.bot_token_exists > 0,
        bot_username: counts.bot_username_exists > 0,
        is_connected: counts.is_connected_exists > 0,
        last_connected_at: counts.last_connected_at_exists > 0
      },
      all_columns_exist: allColumnsExist,
      ready: allColumnsExist,
      message: allColumnsExist ? "Database schema is complete!" : "Database schema needs fixing"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ready: false,
      message: "Database connection error"
    }, { status: 500 });
  }
}