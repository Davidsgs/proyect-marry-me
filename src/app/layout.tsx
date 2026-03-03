import type { Metadata } from "next";
import { Cormorant, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: ["400"], variable: "--font-great-vibes" });

export const metadata: Metadata = {
  title: "Nuestra Boda | David & Rocio",
  description: "Estás invitado a algo especial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
