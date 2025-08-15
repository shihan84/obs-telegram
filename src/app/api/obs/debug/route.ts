import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Debug: Starting OBS connections debug');
    
    // Test basic database connection
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Debug: Database connection successful');
    
    // Check if obs_connections table exists and has data
    try {
      const tableCheck = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'obs_connections' 
        ORDER BY ordinal_position
      `;
      console.log('📋 Debug: obs_connections table structure:', tableCheck);
    } catch (error) {
      console.error('❌ Debug: Error checking table structure:', error);
    }
    
    // Try to get connections with different approaches
    let connections = [];
    
    try {
      connections = await db.oBSConnection.findMany({
        orderBy: { created_at: 'desc' }
      });
      console.log('✅ Debug: Found connections via Prisma:', connections.length, connections);
    } catch (error) {
      console.error('❌ Debug: Prisma query failed:', error);
      
      // Try raw SQL as fallback
      try {
        const rawConnections = await db.$queryRaw`
          SELECT id, name, host, port, password, is_connected, last_connected_at, created_at, updated_at
          FROM obs_connections
          ORDER BY created_at DESC
        `;
        console.log('✅ Debug: Found connections via raw SQL:', rawConnections);
        connections = rawConnections;
      } catch (rawError) {
        console.error('❌ Debug: Raw SQL also failed:', rawError);
      }
    }
    
    // Check if the table is empty
    try {
      const countResult = await db.$queryRaw`
        SELECT COUNT(*)::text as count FROM obs_connections
      `;
      console.log('📊 Debug: Connection count:', countResult);
    } catch (error) {
      console.error('❌ Debug: Count query failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      connections: connections,
      connectionCount: connections.length,
      debug: {
        databaseConnected: true,
        tableChecked: true,
        prismaQuery: !!connections.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug: Overall debug failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}