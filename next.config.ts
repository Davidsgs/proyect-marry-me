import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

if (process.env.NODE_ENV === "development") {
  nextConfig.experimental = {
    // @ts-expect-error this is a new Next.js 16 config option that hasn't made it to the typed config yet
    allowedDevOrigins: [".loca.lt", "localhost:3000", "*.ngrok.io", "*.ngrok-free.app"]
  };
}

export default nextConfig;
