type RateLimitInfo = { count: number; expiresAt: number };

// Simple in-memory rate limiter store
const store = new Map<string, RateLimitInfo>();

/**
 * Basic in-memory rate limiter
 * @param key Identifier for the user/IP
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns boolean indicating if request is allowed (true) or blocked (false)
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const info = store.get(key);

  if (!info || info.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return true; // Allowed
  }

  if (info.count >= limit) {
    return false; // Rate limited
  }

  info.count += 1;
  return true; // Allowed
}
