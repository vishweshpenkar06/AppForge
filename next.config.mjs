import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '**.clerk.accounts.dev',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          // Clerk serves its browser bundle from the instance host, which is
          // *.clerk.accounts.dev on dev instances and *.clerk.com on production ones.
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.telemetry.clerk.com https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com data: blob:",
            "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
            "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.clerk.com https://clerk-telemetry.com wss://*.clerk.com wss://*.clerk.accounts.dev",
            "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
            "worker-src 'self' blob:",
          ].join('; '),
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
}

export default withBundleAnalyzer(nextConfig)
