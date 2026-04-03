import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://187.77.240.222",
    "http://187.77.240.222:3000",
    "187.77.240.222",
  ],

  // Include repo root so serverless functions can read squads/, .aios-core/, .claude/commands/
  outputFileTracingRoot: resolve(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/ecosystem": [
      "../squads/**/*.md",
      "../squads/**/*.yaml",
      "../squads/**/*.yml",
      "../squads/**/*.js",
      "../squads/**/*.json",
      "../.aios-core/development/**/*.md",
      "../.aios-core/development/**/*.yaml",
      "../.claude/commands/**/*.md",
    ],
    "/api/ecosystem/file": [
      "../squads/**/*.md",
      "../squads/**/*.yaml",
      "../squads/**/*.yml",
      "../squads/**/*.js",
      "../squads/**/*.ts",
      "../squads/**/*.json",
      "../.aios-core/development/**/*.md",
      "../.aios-core/development/**/*.yaml",
      "../.claude/commands/**/*.md",
    ],
  },

  turbopack: {},
  webpack: (config) => {
    // pdfjs-dist optionally imports 'canvas' (Node-only); ignore it in the browser bundle
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
