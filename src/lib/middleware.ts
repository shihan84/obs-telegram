import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rate-limit';
import { validateInput } from './validation';

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  private constructor() {}

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  public async applySecurity(request: NextRequest): Promise<NextResponse | null> {
    // Apply rate limiting
    const rateLimitResult = await this.rateLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 415 }
        );
      }
    }

    // Add security headers
    const response = NextResponse.next();
    this.addSecurityHeaders(response);

    return null; // Continue to the next handler
  }

  public addSecurityHeaders(response: NextResponse): void {
    // Remove headers that expose server information
    response.headers.delete('x-powered-by');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // CSP header
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    );
  }

  public sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  public validateBotToken(token: string): boolean {
    // Basic validation for Telegram bot tokens
    const botTokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
    return botTokenRegex.test(token);
  }

  public validateOBSConnection(connection: {
    name: string;
    host: string;
    port: number;
    password?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!connection.name || connection.name.trim().length === 0) {
      errors.push('Connection name is required');
    } else if (connection.name.length > 50) {
      errors.push('Connection name must be less than 50 characters');
    }

    // Validate host
    if (!connection.host || connection.host.trim().length === 0) {
      errors.push('Host is required');
    } else {
      const hostRegex = /^[a-zA-Z0-9.-]+$/;
      if (!hostRegex.test(connection.host)) {
        errors.push('Invalid host format');
      }
    }

    // Validate port
    if (!connection.port || connection.port < 1 || connection.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    // Validate password (optional)
    if (connection.password && connection.password.length > 100) {
      errors.push('Password must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance();