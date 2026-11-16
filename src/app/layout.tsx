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
