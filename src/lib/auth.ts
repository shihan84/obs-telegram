import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

class AuthManager {
  private static instance: AuthManager;
  private sessions: Map<string, Session> = new Map();
  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupSessions(), 60 * 60 * 1000); // Every hour
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private cleanupSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  public async authenticateUser(username: string, password: string): Promise<AuthUser | null> {
    try {
      // For now, we'll use a simple admin user
      // In production, you should use proper password hashing and user management
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username === adminUsername && password === adminPassword) {
        return {
          id: 'admin',
          username: adminUsername,
          isAdmin: true
        };
      }

      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  public createSession(user: AuthUser, request: NextRequest): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.sessionTimeout);
    
    const session: Session = {
      id: sessionId,
      userId: user.id,
      expiresAt,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(request)
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  public validateSession(sessionId: string): AuthUser | null {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        this.sessions.delete(sessionId);
      }
      return null;
    }

    // For now, return a simple admin user
    // In production, you would fetch the user from the database
    return {
      id: session.userId,
      username: 'admin',
      isAdmin: true
    };
  }

  public destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = request.headers.get('cf-connecting-ip'); // Cloudflare

    return ip || realIP || (forwarded ? forwarded.split(',')[0] : 'unknown');
  }

  public async requireAuth(request: NextRequest): Promise<{
    success: true;
    user: AuthUser;
  } | {
    success: false;
    response: NextResponse;
  }> {
    const sessionId = this.getSessionIdFromRequest(request);
    
    if (!sessionId) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    const user = this.validateSession(sessionId);
    
    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        )
      };
    }

    return { success: true, user };
  }

  public async requireAdmin(request: NextRequest): Promise<{
    success: true;
    user: AuthUser;
  } | {
    success: false;
    response: NextResponse;
  }> {
    const authResult = await this.requireAuth(request);
    
    if (!authResult.success) {
      return authResult;
    }

    if (!authResult.user.isAdmin) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      };
    }

    return authResult;
  }

  private getSessionIdFromRequest(request: NextRequest): string | null {
    // Try to get session ID from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get session ID from cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      return cookies.sessionId || null;
    }

    return null;
  }

  public setSessionCookie(response: NextResponse, sessionId: string): void {
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.sessionTimeout / 1000,
      path: '/'
    });
  }

  public clearSessionCookie(response: NextResponse): void {
    response.cookies.set('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
  }
}

export const authManager = AuthManager.getInstance();

// Middleware functions
export async function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authManager.requireAuth(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    return handler(request, authResult.user);
  };
}

export async function withAdmin(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authManager.requireAdmin(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    return handler(request, authResult.user);
  };
}