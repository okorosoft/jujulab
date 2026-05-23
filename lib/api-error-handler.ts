/**
 * API Error Handler Utility
 * 
 * Provides standardized error handling for API routes following CodeCanyon requirements:
 * - Uses Error objects (or subclasses) for all errors
 * - Wraps lower-level errors with context
 * - Augments Error objects with properties that explain details
 * - Ensures consistent error response format
 */

import { NextResponse } from 'next/server';

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * Wrap a lower-level error with context
 * Following CodeCanyon requirement: "If you pass a lower-level error to your caller, consider wrapping it instead"
 */
export function wrapError(
  error: unknown,
  context: string,
  statusCode: number = 500,
  code: string = 'WRAPPED_ERROR'
): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    return new APIError(
      `${context}: ${error.message}`,
      statusCode,
      code,
      { originalMessage: error.message },
      error
    );
  }

  return new APIError(
    `${context}: Unknown error occurred`,
    statusCode,
    code,
    { originalError: String(error) }
  );
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Handle API route errors consistently
 * Logs errors appropriately without exposing sensitive information
 */
export function handleAPIError(error: unknown, context: string): NextResponse {
  const wrappedError = wrapError(error, context);
  
  // Log error details server-side (not exposed to client)
  // In production, this should be sent to logging service instead of console
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, {
      message: wrappedError.message,
      code: wrappedError.code,
      statusCode: wrappedError.statusCode,
      originalError: wrappedError.originalError?.message,
      stack: wrappedError.stack,
    });
  }

  return createErrorResponse(wrappedError);
}

