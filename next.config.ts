import type { NextConfig } from "next";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  // ── Imágenes remotas ──────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ztcuv77y.us-west.insforge.app",
        pathname: "/**",
      },
    ],
  },

  // ── Cabeceras de seguridad (producción) ───────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Fuerza HTTPS por 1 año (incluye subdominios)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Impide que la app se cargue en un <iframe> en otro dominio
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Bloquea MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Política de referrer conservadora
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Deshabilita acceso a APIs sensibles del navegador
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
