/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static site generation for Cloudflare Pages
  output: 'export',
  
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
  
  // Optimize imports
  experimental: {
    optimizePackageImports: ['zustand', 'sonner'],
  },
  
  // Trailing slashes for static hosting
  trailingSlash: true,
  
  // Suppress build errors for missing API routes
  // The app now uses Supabase directly from the browser
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
