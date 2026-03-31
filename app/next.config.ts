import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://187.77.240.222",
    "http://187.77.240.222:3000",
    "187.77.240.222",
  ],
  turbopack: {},
  webpack: (config) => {
    // pdfjs-dist optionally imports 'canvas' (Node-only); ignore it in the browser bundle
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
