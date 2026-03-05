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

/**
 * Get remaining requests and reset time for a rate limit key
 */
export function getRateLimitStatus(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const info = store.get(key);

  if (!info || info.expiresAt < now) {
    return { remaining: limit, resetAt: now + windowMs, isLimited: false };
  }

  return {
    remaining: Math.max(0, limit - info.count),
    resetAt: info.expiresAt,
    isLimited: info.count >= limit,
  };
}

// Upload rate limit: 20 uploads per hour
export function checkUploadRateLimit(userId: string): boolean {
  return rateLimit(`upload:${userId}`, 20, 60 * 60 * 1000);
}

// Document creation rate limit: 50 per hour
export function checkDocumentCreationRateLimit(userId: string): boolean {
  return rateLimit(`doc_create:${userId}`, 50, 60 * 60 * 1000);
}

// Comment rate limit: 100 per hour
export function checkCommentRateLimit(userId: string): boolean {
  return rateLimit(`comment:${userId}`, 100, 60 * 60 * 1000);
}

// Folder creation rate limit: 30 per hour
export function checkFolderCreationRateLimit(userId: string): boolean {
  return rateLimit(`folder_create:${userId}`, 30, 60 * 60 * 1000);
}

// API call rate limit (global): 1000 per minute per user
export function checkAPIRateLimit(userId: string): boolean {
  return rateLimit(`api:${userId}`, 1000, 60 * 1000);
}

// Login attempt rate limit: 10 per 5 minutes per email
export function checkLoginRateLimit(email: string): boolean {
  return rateLimit(`login:${email}`, 10, 5 * 60 * 1000);
}

// Get all rate limit info for a user (useful for API response headers)
export function getUserRateLimitInfo(userId: string) {
  return {
    upload: getRateLimitStatus(`upload:${userId}`, 20, 60 * 60 * 1000),
    docCreate: getRateLimitStatus(`doc_create:${userId}`, 50, 60 * 60 * 1000),
    comment: getRateLimitStatus(`comment:${userId}`, 100, 60 * 60 * 1000),
    folderCreate: getRateLimitStatus(`folder_create:${userId}`, 30, 60 * 60 * 1000),
    api: getRateLimitStatus(`api:${userId}`, 1000, 60 * 1000),
  };
}
