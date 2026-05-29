// ============================================================
// app/layout.tsx — Layout Raíz
// Novatada ULEAM 2026
// ============================================================

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://novatada2026.vercel.app"),
  title: "Novatada ULEAM 2026 — Entradas Digitales",
  description:
    "Adquiere tu entrada digital para la Novatada ULEAM Chone 2026. Sistema seguro de tickets con código QR. Asociación de Estudiantes Uleam Chone.",
  keywords: ["novatada", "uleam", "chone", "fiesta universitaria", "tickets", "entradas"],
  alternates: {
    canonical: "https://novatada2026.vercel.app",
  },
  openGraph: {
    title: "Novatada ULEAM 2026 — Entradas Digitales",
    description: "¡La fiesta universitaria más esperada del año! Adquiere tu entrada digital.",
    url: "https://novatada2026.vercel.app",
    siteName: "Novatada ULEAM 2026",
    type: "website",
    locale: "es_EC",
  },
  twitter: {
    card: "summary",
    title: "Novatada ULEAM 2026 — Entradas Digitales",
    description: "¡La fiesta universitaria más esperada del año! Adquiere tu entrada digital.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
