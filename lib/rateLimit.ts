type RateLimitInfo = { count: number; expiresAt: number };


const store = new Map<string, RateLimitInfo>();

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

export function checkUploadRateLimit(userId: string): boolean {
  return rateLimit(`upload:${userId}`, 20, 60 * 60 * 1000);
}
