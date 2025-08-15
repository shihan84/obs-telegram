import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { bot_token, bot_username } = await request.json()
    
    if (!bot_token) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 })
    }
    
    // Use raw SQL to bypass Prisma issues
    const result = await db.$executeRaw`
      INSERT INTO bot_configurations (bot_token, bot_username, welcome_message)
      VALUES (${bot_token}, ${bot_username || 'OBSControlBot'}, 'Welcome to OBS Control Bot!')
      ON CONFLICT (bot_token) DO UPDATE 
      SET bot_username = ${bot_username || 'OBSControlBot'},
          updated_at = NOW()
    `
    
    return NextResponse.json({ success: true, message: 'Bot configured successfully' })
  } catch (error) {
    console.error('Error configuring bot:', error)
    return NextResponse.json({ error: 'Failed to configure bot' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const config = await db.botConfiguration.findFirst()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching bot config:', error)
    return NextResponse.json({ error: 'Failed to fetch bot config' }, { status: 500 })
  }
}
