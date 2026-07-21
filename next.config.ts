import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer (and Prisma) must only run on the server side.
  // Prevent webpack from trying to bundle server-only modules on the client.
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@prisma/client"],
};

export default nextConfig;
