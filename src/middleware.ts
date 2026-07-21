/**
 * Security Middleware
 * Handles security headers and authentication for Next.js 15
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============================================
  // Security Headers
  // ============================================
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // ============================================
  // Content Security Policy (CSP)
  // ============================================
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + inline for Next.js + unsafe-eval for dev
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles: self + inline + Tailwind
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self + data URIs + Supabase + external HTTPS
    "img-src 'self' data: https: blob:",
    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Connect: self + Supabase
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Frames: none
    "frame-ancestors 'none'",
    // Base URI
    "base-uri 'self'",
    // Form actions
    "form-action 'self'",
    // Upgrade insecure requests in production
    process.env.NODE_ENV === 'production' 
      ? "upgrade-insecure-requests" 
      : "",
  ].filter(Boolean);

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // ============================================
  // HSTS (HTTPS Only in Production)
  // ============================================
  if (request.headers.get('x-forwarded-proto') === 'https') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // ============================================
  // Cache Control for API Routes
  // ============================================
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
  }

  // ============================================
  // Remove sensitive headers
  // ============================================
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - .well-known (security/cert files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
