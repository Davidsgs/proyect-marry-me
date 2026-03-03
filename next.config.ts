import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [".loca.lt", "localhost:3000", "*.ngrok.io", "*.ngrok-free.app"]
  }
};

export default nextConfig;
