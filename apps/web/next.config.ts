import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // Pin the workspace root so Turbopack doesn't infer $HOME and watch the
  // entire home directory (which froze the machine). Monorepo root is two up.
  turbopack: { root: path.join(__dirname, "..", "..") },

  // Prevent webpack from bundling native addons used only in SQLite test mode.
  // In production (PostgreSQL), these packages are never imported because
  // lib/prisma.ts only require()s them when DATABASE_URL starts with "file:".
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
