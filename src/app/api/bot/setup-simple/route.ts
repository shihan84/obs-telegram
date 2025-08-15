import { NextRequest, NextResponse } from 'next/server';

// Simple bot setup that uses direct PostgreSQL connection to avoid Prisma issues
export async function POST(request: NextRequest) {
  try {
    const { botToken } = await request.json();

    if (!botToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Bot token is required' 
      }, { status: 400 });
    }

    console.log('🤖 Setting up bot with simple method...');

    // Test bot API connection first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from Telegram API');
      }

      const data = JSON.parse(responseText);
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      console.log('✅ Bot API connection successful:', data.result.username);

      // Use node-postgres directly to avoid Prisma prepared statement issues
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
      });

      try {
        // Clear existing configurations
        await pool.query('TRUNCATE TABLE bot_configurations RESTART IDENTITY CASCADE');
        
        // Insert new configuration
        await pool.query(`
          INSERT INTO bot_configurations (bot_token, bot_username, welcome_message, admin_only_commands, is_webhook_enabled, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
          botToken,
          data.result.username || null,
          'Welcome to OBS Control Bot! Use /help to see available commands.',
          true,
          false
        ]);
        
        await pool.end();
        
        console.log('✅ Bot configuration saved successfully using direct PostgreSQL');

        return NextResponse.json({
          success: true,
          message: 'Bot configured successfully using direct PostgreSQL',
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            is_bot: data.result.is_bot
          },
          nextSteps: {
            message: 'Bot is now configured! You can test the connection and add OBS connections.',
            note: 'Used direct PostgreSQL connection to avoid Prisma issues'
          }
        });

      } catch (dbError) {
        console.error('PostgreSQL direct error:', dbError);
        await pool.end();
        return NextResponse.json({
          success: false,
          error: 'Failed to save bot configuration using direct PostgreSQL',
          details: dbError instanceof Error ? dbError.message : 'Database error',
          suggestion: 'Check database connection and permissions'
        }, { status: 500 });
      }

    } catch (apiError) {
      console.error('Bot API test failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Bot token validation failed',
        details: apiError instanceof Error ? apiError.message : 'API test failed',
        suggestion: 'Please check your bot token and ensure it\'s valid.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error setting up bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to setup bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Bot Setup API (Direct PostgreSQL)',
    usage: 'POST /api/bot/setup-simple',
    parameters: {
      botToken: 'Telegram bot token (required)'
    },
    note: 'This endpoint uses direct PostgreSQL connection to avoid Prisma prepared statement issues'
  });
}