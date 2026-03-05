import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Consistent API response format for all endpoints
 * 
 * Usage:
 * - Success: apiSuccess(data)
 * - Error: apiError('message', 500, 'ERROR_CODE')
 */

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(
  message: string,
  status = 500,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

export function apiValidationError(issues: any[]): NextResponse<ApiErrorResponse> {
  return apiError('Validation failed', 400, 'VALIDATION_ERROR', issues);
}

export function apiNotFound(resource = 'Resource'): NextResponse<ApiErrorResponse> {
  return apiError(`${resource} not found`, 404, 'NOT_FOUND');
}

export function apiForbidden(message = 'Access denied'): NextResponse<ApiErrorResponse> {
  return apiError(message, 403, 'FORBIDDEN');
}

export function apiUnauthorized(): NextResponse<ApiErrorResponse> {
  return apiError('Unauthorized', 401, 'UNAUTHORIZED');
}

export function apiRateLimited(message = 'Rate limit exceeded'): NextResponse<ApiErrorResponse> {
  return apiError(message, 429, 'RATE_LIMIT_EXCEEDED');
}
