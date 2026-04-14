import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

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
