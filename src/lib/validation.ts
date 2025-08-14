import { z } from 'zod';

// Common validation schemas
export const schemas = {
  botToken: z.string()
    .min(46, 'Bot token must be at least 46 characters')
    .max(46, 'Bot token must be exactly 46 characters')
    .regex(/^\d+:[A-Za-z0-9_-]{35}$/, 'Invalid bot token format'),

  obsConnection: z.object({
    name: z.string()
      .min(1, 'Connection name is required')
      .max(50, 'Connection name must be less than 50 characters')
      .regex(/^[a-zA-Z0-9\s_-]+$/, 'Connection name can only contain letters, numbers, spaces, hyphens, and underscores'),
    
    host: z.string()
      .min(1, 'Host is required')
      .max(253, 'Host must be less than 253 characters')
      .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid host format'),
    
    port: z.number()
      .min(1, 'Port must be at least 1')
      .max(65535, 'Port must be less than 65535'),
    
    password: z.string()
      .max(100, 'Password must be less than 100 characters')
      .optional()
  }),

  userId: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),

  adminStatus: z.object({
    isAdmin: z.boolean('Admin status must be a boolean')
  })
};

// Validation functions
export function validateInput<T>(data: unknown, schema: z.ZodSchema<T>): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isSafePath(path: string): boolean {
  // Prevent directory traversal attacks
  return !path.includes('..') && !path.startsWith('/') && !path.startsWith('\\');
}

// Request validation middleware
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; response: Response }> {
  try {
    const body = await request.json();
    const validation = validateInput(body, schema);
    
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        response: new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON body',
      response: new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
}

// Parameter validation
export function validateParams(params: Record<string, string>, required: string[]): {
  success: true;
  data: Record<string, string>;
} | {
  success: false;
  error: string;
  response: Response;
} {
  const missing = required.filter(param => !params[param]);
  
  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required parameters: ${missing.join(', ')}`,
      response: new Response(
        JSON.stringify({ error: `Missing required parameters: ${missing.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  return { success: true, data: params };
}