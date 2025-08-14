import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Get bot configuration from database
    const botConfig = await db.botConfiguration.findFirst();
    
    if (!botConfig || !botConfig.bot_token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }

    // Test bot API connection
    const testResults = {
      apiConnection: false,
      botInfo: null,
      lastTestTime: new Date().toISOString(),
      error: null as string | null
    };

    try {
      // Test bot connection by getting bot info
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://api.telegram.org/bot${botConfig.bot_token}/getMe`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const responseText = await response.text();
        
        // Check if response is empty
        if (!responseText.trim()) {
          testResults.error = 'Empty response from Telegram API';
          return NextResponse.json(testResults);
        }
        
        try {
          const data = JSON.parse(responseText);
          if (data.ok) {
            testResults.apiConnection = true;
            testResults.botInfo = data.result;
          } else {
            testResults.error = data.description || 'Unknown API error';
          }
        } catch (jsonError) {
          testResults.error = `Invalid JSON response: ${responseText.substring(0, 200)}`;
        }
      } else {
        const errorText = await response.text();
        testResults.error = `HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          testResults.error = 'Request timeout (10 seconds)';
        } else {
          testResults.error = error.message;
        }
      } else {
        testResults.error = 'Network error';
      }
    }

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Error testing bot:', error);
    return NextResponse.json({ error: 'Failed to test bot' }, { status: 500 });
  }
}