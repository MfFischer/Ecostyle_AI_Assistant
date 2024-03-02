import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Use port 3005 since 3000-3003 are in use
  async rewrites() {
    return [];
  },
};

export default nextConfig;
