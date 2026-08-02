import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Next.js CLI ALWAYS sets process.env.NODE_ENV = "production" during `next build`, 
// even if NODE_ENV=development is set in .env.
// To stop uploading sourcemaps during local builds/dev, use `sourcemaps: { disable: true }`
// or require an explicit flag like `SENTRY_UPLOAD_SOURCEMAPS=true`.
const shouldUploadSourcemaps = process.env.SENTRY_UPLOAD_SOURCEMAPS === "true";

const config = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "learner-va",
  project: process.env.SENTRY_PROJECT || "cse-cns",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !shouldUploadSourcemaps,
  sourcemaps: {
    disable: !shouldUploadSourcemaps,
  },
});

export default config;
