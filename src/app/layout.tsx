import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "OBX Sentinel - Monitorización de Ciberseguridad",
  description: "Plataforma de monitorización de superficie de ataque externa para pymes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
