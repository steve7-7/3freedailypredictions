import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Arena/e2b live-preview hosts during `next dev`.
  allowedDevOrigins: ["*.e2b.app"],
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
