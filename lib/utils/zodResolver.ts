/**
 * Custom Zod v4-compatible resolver for react-hook-form.
 *
 * @hookform/resolvers v3.x only supports Zod v3 (uses `.errors` on ZodError).
 * Zod v4 renames this to `.issues`. This resolver handles both.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod';

function parseZodIssues(issues: any[]): Record<string, { message: string; type: string }> {
  const errors: Record<string, { message: string; type: string }> = {};
  for (const issue of issues) {
    const key = Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path ?? '');
    if (!errors[key]) {
      errors[key] = { message: issue.message ?? 'Invalid value', type: issue.code ?? 'custom' };
    }
  }
  return errors;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function zodResolver<T extends z.ZodTypeAny>(schema: T) {
  return async (values: unknown): Promise<{ values: any; errors: any }> => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    // Zod v4 exposes issues on the ZodError object
    const err = result.error as any;
    const issues: any[] = Array.isArray(err?.issues) ? err.issues : Array.isArray(err?.errors) ? err.errors : [];

    const fieldErrors = parseZodIssues(issues);
    return { values: {}, errors: fieldErrors };
  };
}
