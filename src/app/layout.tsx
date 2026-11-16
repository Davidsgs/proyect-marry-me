import type { Metadata, Viewport } from "next";
import { Marcellus, Mulish } from "next/font/google";
import "./globals.css";

// Pareja «Inscripción serena»: Marcellus (títulos, un solo peso) + Mulish (todo el texto).
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marcellus",
});
const mulish = Mulish({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "Nuestra boda | David & Rocío",
  description: "Invitación privada a la boda de David y Rocío.",
  // Base de las URL absolutas (imagen de vista previa): el dominio de producción
  // de Vercel si existe; si no, el dominio de la invitación.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.davidyrocio.wedding",
  ),
  // Invitación privada: fuera de buscadores. Sin robots.txt que bloquee, para
  // que Google pueda leer este noindex y no liste ni la URL.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Boda de David y Rocío",
    description: "Tu invitación: confirma tu asistencia, mira tu mesa y todos los detalles del día.",
    type: "website",
    locale: "es_AR",
  },
};

export const viewport: Viewport = {
  themeColor: "#d9a3a0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${marcellus.variable} ${mulish.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
