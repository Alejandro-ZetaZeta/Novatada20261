"use client";

// ============================================================
// components/ui/QRCode.tsx — Generador de Código QR
// ============================================================
// Genera el QR en el frontend usando la librería qrcode.
// El QR contiene la URL de validación del ticket.
// BLINDAJE: el backend valida auth antes de procesar.
// ============================================================

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  /** UUID del ticket — se incluye en la URL del QR */
  uuid: string;
  /** Tamaño del canvas en px */
  tamaño?: number;
  /** Estado del ticket — solo muestra QR si está activo */
  estado: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://novatada20261.vercel.app";

export default function QRCode({ uuid, tamaño = 200, estado }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || estado !== "activo") return;

    // URL que el scanner del staff accederá
    const urlValidacion = `${BASE_URL}/api/tickets/${uuid}/validar`;

    QRCodeLib.toCanvas(canvasRef.current, urlValidacion, {
      width: tamaño,
      margin: 2,
      color: {
        dark: "#1A0A2E",  // Fondo oscuro del QR
        light: "#F5F3FF", // Módulos del QR
      },
      errorCorrectionLevel: "H",
    });
  }, [uuid, tamaño, estado]);

  if (estado !== "activo") {
    return (
      <div
        style={{
          width: tamaño,
          height: tamaño,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(124, 58, 237, 0.05)",
          border: "1px solid rgba(124, 58, 237, 0.15)",
          borderRadius: "12px",
          gap: "12px",
        }}
      >
        {/* Ícono de candado SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ width: 48, height: 48, color: "var(--color-text-muted)" }}
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.8rem",
            textAlign: "center",
            maxWidth: "140px",
            fontFamily: "var(--font-body)",
          }}
        >
          {estado === "pendiente"
            ? "QR disponible al aprobar la orden"
            : "Ticket ya utilizado"}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        background: "#F5F3FF",
        borderRadius: "16px",
        display: "inline-block",
        boxShadow: "var(--glow-primary)",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", borderRadius: "8px" }} />
    </div>
  );
}
