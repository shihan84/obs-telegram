import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BotManager } from '@/lib/bot/bot.manager'

export async function POST(request: NextRequest) {
  try {
    const { bot_token, bot_username } = await request.json()
    
    if (!bot_token) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 })
    }
    
    // Configure bot using direct database operations
    const config = await db.botConfiguration.upsert({
      where: { id: 1 },
      update: {
        bot_token,
        bot_username: bot_username || 'OBSControlBot',
        welcome_message: 'Welcome to OBS Control Bot! 🎥'
      },
      create: {
        bot_token,
        bot_username: bot_username || 'OBSControlBot',
        welcome_message: 'Welcome to OBS Control Bot! 🎥'
      }
    })
    
    // Start the bot
    const botManager = BotManager.getInstance()
    await botManager.initialize()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bot configured and started successfully',
      bot_username: bot_username || 'OBSControlBot'
    })
  } catch (error) {
    console.error('Error setting up bot:', error)
    return NextResponse.json({ error: 'Failed to setup bot' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const config = await db.botConfiguration.findFirst()
    const isRunning = BotManager.getInstance().isBotRunning()
    
    return NextResponse.json({ 
      config, 
      is_running: isRunning,
      status: config ? 'configured' : 'not_configured'
    })
  } catch (error) {
    console.error('Error fetching bot status:', error)
    return NextResponse.json({ error: 'Failed to fetch bot status' }, { status: 500 })
  }
}
