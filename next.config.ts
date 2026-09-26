import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Orígenes permitidos en desarrollo (túneles para probar desde el móvil).
  allowedDevOrigins: [".loca.lt", "localhost:3000", "*.ngrok.io", "*.ngrok-free.app"],
};

export default nextConfig;
