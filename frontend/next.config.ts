import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Allow development access from specific origins
  allowedDevOrigins: [
    '192.168.102.94',           // Your server IP
    'localhost',
    '127.0.0.1',
    // Add any other IPs that need dev access
    // e.g., '192.168.1.100' for another developer's machine
  ],
  
  // better-auth proxy
  async rewrites() {
    return [
      {
        // Explicitly map auth requests
        source: "/api/auth/:path*",
        destination: process.env.NEXT_PUBLIC_BASE_URL + "/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
