/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatible settings
  images: {
    unoptimized: true, // Required for Cloudflare Pages
  },
  
  // Disable static generation for API routes that need edge runtime
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three', 'zustand'],
  },
  
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Cloudflare Pages requires this header handling in middleware instead
  // Security headers are now in middleware.ts
  async headers() {
    return [];
  },
  
  // Cloudflare Pages output configuration
  output: 'standalone',
  
  // Ensure proper module transpilation for edge runtime
  transpilePackages: [],
};

// Handle Cloudflare Pages deployment
const isCloudflarePages = process.env.DEPLOYMENT_ENV === 'cloudflare_pages';

if (isCloudflarePages) {
  // Cloudflare Pages specific configuration
  nextConfig.output = 'export';
  nextConfig.images.unoptimized = true;
}

export default nextConfig;
