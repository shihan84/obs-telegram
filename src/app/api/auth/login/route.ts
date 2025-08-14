import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { validateInput, schemas } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(body, schemas.authCredentials || z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    }));
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Authenticate user
    const user = await authManager.authenticateUser(username, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = authManager.createSession(user, request);
    
    // Create response with session cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });

    authManager.setSessionCookie(response, sessionId);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { z } from 'zod';

// Add auth credentials schema to schemas
schemas.authCredentials = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});