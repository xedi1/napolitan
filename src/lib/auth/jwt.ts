/**
 * JWT utilities using jose library
 * Works in Edge runtimes (Cloudflare Workers, Vercel Edge, etc.)
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'napolitan-secret-key-change-in-production-32chars'
);

const COOKIE_NAME = 'napoli_session';

export interface JWTPayload {
  userId: number;
  username: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getCookieOptions(maxAge: number = 8 * 60 * 60) {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    },
  };
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export { COOKIE_NAME };
