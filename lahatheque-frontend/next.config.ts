import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pdfjs-dist"],
  serverExternalPackages: ["canvas"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-04ee70fd927649918bb42c881e0db428.r2.dev",
      },
      {
        protocol: "https",
        hostname: "videodelivery.net",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./lib/canvas-stub.ts",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
