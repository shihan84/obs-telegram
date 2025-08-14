import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { withAuth } from '@/lib/auth';

async function checkAuthHandler(request: NextRequest, user: any): Promise<NextResponse> {
  try {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(checkAuthHandler);