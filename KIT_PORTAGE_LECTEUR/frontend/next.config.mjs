/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // Préserver les slashes finaux pour Django
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  transpilePackages: ['pdfjs-dist', '@react-pdf-viewer/core', '@react-pdf-viewer/default-layout', '@react-pdf-viewer/page-navigation', '@react-pdf-viewer/highlight', 'react-pageflip'],

  // Rediriger les appels API vers le backend Django
  // IMPORTANT: /api/auth/* et /api/bff/* sont des Route Handlers Next.js — ils ne doivent PAS être réécrits.
  // Seules les routes Django directes (ex: pour le register public) passent en fallback.
  async rewrites() {
    const DJANGO_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '').replace(/\/$/, '');
    return {
      // beforeFiles: intercepté AVANT les pages Next.js (priorité haute)
      beforeFiles: [],
      // afterFiles: intercepté APRÈS les pages Next.js mais AVANT le 404
      afterFiles: [],
      // fallback: dernier recours — NE capture PAS les routes Next.js existantes
      // Cela signifie que /api/auth/* et /api/bff/* (qui sont des Route Handlers) ne seront jamais capturés ici.
      fallback: [
        {
          source: '/api/v1/:path*/',
          destination: '/api/bff/:path*/',
        },
        {
          source: '/api/v1/:path*',
          destination: '/api/bff/:path*/',
        },
      ]
    }
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'customer-ekix3ypiu6mjzeb4.cloudflarestream.com',
      },
      {
        protocol: 'https',
        hostname: 'customer-v678pxz.cloudflarestream.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-04ee70fd927649918bb42c881e0db428.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'purecatamphetamine.github.io',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              // TODO: Migrer vers nonces (Next.js middleware) — Sprint Sécu #2
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.100ms.live https://*.jitsi.org https://www.geogebra.org https://cdn.geogebra.org https://embed.cloudflarestream.com https://*.cloudflarestream.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://*.sentry.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.cloudflarestream.com https://*.r2.dev https://images.unsplash.com https://purecatamphetamine.github.io",
              "media-src 'self' blob: https://*.cloudflarestream.com https://customer-ekix3ypiu6mjzeb4.cloudflarestream.com https://customer-v678pxz.cloudflarestream.com https://iframe.videodelivery.net https://*.videodelivery.net https://*.r2.dev",
              "connect-src 'self' https://*.lahaacademia.com https://lahaacademia.com wss://*.lahaacademia.com https://*.lahacademia.com wss://*.lahacademia.com https://*.sslip.io wss://*.sslip.io https://lahaacademia-uszs.onrender.com wss://lahaacademia-uszs.onrender.com wss://*.100ms.live https://*.100ms.live https://*.vercel.app https://lahacademia.com https://vitals.vercel-insights.com https://fonts.googleapis.com https://api.moneroo.io https://*.r2.dev https://*.cloudflarestream.com wss://*.cloudflarestream.com https://cloudflarestream.com https://*.videodelivery.net https://videodelivery.net https://*.cloudflarestorage.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://*.sentry.io",
              "worker-src 'self' blob:",
              "frame-src 'self' https://*.jitsi.org https://*.100ms.live https://iframe.videodelivery.net https://*.cloudflarestream.com https://www.geogebra.org https://api.geogebra.org https://view.officeapps.live.com",
            ].join('; ')
          },
        ],
      },
    ]
  },
  webpack(config, { dev }) {
    if (dev) {
      config.devtool = 'source-map'
    }
    // Fix for pdfjs-dist / react-pdf-viewer
    config.resolve.alias.canvas = false;
    // Force Next.js to use the CommonJS legacy build of pdfjs-dist to prevent "Unexpected token 'export'" error
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf.js';
    return config
  },
}

export default nextConfig
// Restart trigger for translation patch