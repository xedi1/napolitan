/**
 * Security Middleware
 * Handles security headers and authentication for Next.js 15 on Cloudflare Pages
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cloudflare Pages compatible middleware
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
  // Simplified for Cloudflare Pages compatibility
  // ============================================
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + inline for Next.js (required for hydration)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles: self + inline for Tailwind and Next.js
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self + data URIs + external HTTPS
    "img-src 'self' data: https: blob:",
    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Connect: self + Supabase (if used)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Frames: none
    "frame-ancestors 'none'",
    // Base URI
    "base-uri 'self'",
    // Form actions
    "form-action 'self'",
  ];

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // ============================================
  // Cache Control for API Routes
  // API routes don't work on Cloudflare Pages without adapter
  // ============================================
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Return a JSON response for API routes on Cloudflare Pages
    // since Next.js API routes aren't supported natively
    return NextResponse.json(
      { error: 'API routes not supported on Cloudflare Pages. Use client-side data.' },
      { status: 503 }
    );
  }

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
