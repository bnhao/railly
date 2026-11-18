import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
