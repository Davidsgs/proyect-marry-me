import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transiciones entre páginas con <ViewTransition> de React (ver src/app/template.tsx).
  experimental: { viewTransition: true },
  // Orígenes permitidos en desarrollo (túneles para probar desde el móvil).
  allowedDevOrigins: [".loca.lt", "localhost:3000", "*.ngrok.io", "*.ngrok-free.app"],
};

export default nextConfig;
