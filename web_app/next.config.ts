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
  // Suppress middleware deprecation warning (auth middleware still supported)
  // The warning is about API proxy middleware, not auth middleware
  experimental: {
    // Enable middleware for auth (will be migrated to new pattern in future)
  },
};

export default nextConfig;
