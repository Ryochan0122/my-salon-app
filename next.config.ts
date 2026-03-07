import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Next.js 15以降の安定版では、experimentalの外に記述します
  allowedDevOrigins: ["192.168.0.5", "localhost:3000"],
};

export default nextConfig;