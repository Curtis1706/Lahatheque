import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["canvas"],
  images: {
    remotePatterns: [
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
};

export default nextConfig;
