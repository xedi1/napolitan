/**
 * JWT Token Utility
 * Handles secure token generation and verification with modern APIs
 */

import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'napolitan-secret-key-change-in-production-2027'
);

const ACCESS_TOKEN_EXPIRATION = '8h';
const REFRESH_TOKEN_EXPIRATION = '7d';

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'manager' | 'kitchen' | 'waiter';
  name: string;
  type: 'access' | 'refresh';
}

/**
 * Generate an access token for authenticated user
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token for authenticated user
 */
export async function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
}

/**
 * Verify access token specifically
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  const payload = await verifyToken(token);
  if (payload && payload.type === 'access') {
    return payload;
  }
  return null;
}

/**
 * Verify refresh token specifically
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  const payload = await verifyToken(token);
  if (payload && payload.type === 'refresh') {
    return payload;
  }
  return null;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
