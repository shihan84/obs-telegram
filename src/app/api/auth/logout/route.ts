import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { withAuth } from '@/lib/auth';

async function logoutHandler(request: NextRequest, user: any): Promise<NextResponse> {
  try {
    const sessionId = authManager.getSessionIdFromRequest(request);
    
    if (sessionId) {
      authManager.destroySession(sessionId);
    }

    const response = NextResponse.json({ message: 'Logout successful' });
    authManager.clearSessionCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(logoutHandler);