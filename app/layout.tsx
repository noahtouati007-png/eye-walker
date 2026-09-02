import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eye-Walker — Hyrox Solo Pro",
  description:
    "Programme d'entraînement Hyrox élite, 7 séances par semaine, XP, badges et progression. Solo Pro.",
  icons: { icon: "/favicon.svg" },
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${orbitron.variable}`}>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "rgba(18,18,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f0f0ff",
            },
          }}
        />
      </body>
    </html>
  );
}
