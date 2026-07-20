/**
 * Simple in-memory rate limiter for login attempts
 * In production, use Redis or a distributed store
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit: 5 attempts per 15 minutes per IP
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, RateLimitEntry>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  // Clean up expired entries periodically
  if (attempts.size > 10000) {
    Array.from(attempts.entries()).forEach(([key, value]) => {
      if (value.resetTime < now) {
        attempts.delete(key);
      }
    });
  }

  if (!entry || entry.resetTime < now) {
    // New entry or expired window
    attempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetIn: entry.resetTime - now };
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}
