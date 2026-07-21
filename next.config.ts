import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimized Package Imports
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three', 'zustand'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Security headers are handled in middleware
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
