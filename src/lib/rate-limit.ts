import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom message for rate limit exceeded
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      windowMs: options.windowMs,
      max: options.max,
      message: options.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator
    };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.options.windowMs);
  }

  private defaultKeyGenerator(req: NextRequest): string {
    // Use IP address as the key
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  public async check(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  }> {
    const key = this.options.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Initialize or reset the counter for this key
    if (!this.store[key] || this.store[key].resetTime < windowStart) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.options.windowMs
      };
    }

    const record = this.store[key];
    const allowed = record.count < this.options.max;
    const remaining = Math.max(0, this.options.max - record.count);

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
      total: this.options.max
    };
  }

  public async increment(req: NextRequest, success?: boolean): Promise<void> {
    const key = this.options.keyGenerator(req);
    
    // Skip incrementing based on success/failure if configured
    if (success !== undefined) {
      if (success && this.options.skipSuccessfulRequests) {
        return;
      }
      if (!success && this.options.skipFailedRequests) {
        return;
      }
    }

    if (this.store[key]) {
      this.store[key].count++;
    }
  }
}

export function rateLimit(options: RateLimitOptions) {
  const limiter = new RateLimiter(options);

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const result = await limiter.check(req);

    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: options.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.total.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', result.total.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return null;
  };
}

export { RateLimiter };