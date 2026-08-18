import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
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
            value: 'DENY'
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
          },
          {
            // Report-only deliberately. A CSP that blocks something the app needs is worse
            // than no CSP, and this app loads Google Maps, Sentry, Vercel analytics and
            // signed S3 URLs. Watch the violation reports, confirm nothing legitimate is
            // listed, then rename this header to Content-Security-Policy.
            //
            // 'unsafe-inline' and 'unsafe-eval' are here because Next.js injects inline
            // bootstrap scripts and the JSON-LD blocks are inline. Removing them requires
            // a nonce, which is the follow-up once the policy is enforcing.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.amazonaws.com https://maps.googleapis.com https://maps.gstatic.com https://*.tile.openstreetmap.org",
              "font-src 'self' data:",
              // ws: and wss: are required for the dev server's hot reload channel.
              "connect-src 'self' ws: wss: https://maps.googleapis.com https://*.amazonaws.com https://*.ingest.sentry.io https://*.upstash.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; ')
          }
        ]
      },
      {
        // Cache static assets aggressively
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Don't cache API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ]
  }
};

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "aljinan",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Reduce bundle size - don't upload extra source maps
  widenClientFileUpload: false,  // Changed from true

  // Automatically annotate React components
  reactComponentAnnotation: {
    enabled: true,
  },

  // Disable tunnel in production to reduce server load
  tunnelRoute: process.env.NODE_ENV === 'development' ? "/monitoring" : undefined,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
});
