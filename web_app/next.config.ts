import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Strict mode for better error detection
  reactStrictMode: true,

  // Output configuration for deployment
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  // Suppress middleware deprecation warning (auth middleware still supported)
  // The warning is about API proxy middleware, not auth middleware
  experimental: {
    // Enable middleware for auth (will be migrated to new pattern in future)
  },
};

export default nextConfig;
