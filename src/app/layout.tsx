import type { Metadata } from "next";
import { Cormorant, Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant" });
const pinyonScript = Pinyon_Script({ weight: ["400"], subsets: ["latin"], variable: "--font-pinyon-script" });

export const metadata: Metadata = {
  title: "Nuestra Boda | David & Rocio",
  description: "Te invitamos a nuestro momento especial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${cormorant.variable} ${pinyonScript.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
