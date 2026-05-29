"use client";

// ============================================================
// components/ui/Badge.tsx — Badge de Estado
// ============================================================

import { EstadoTicket, EstadoOrden } from "@/lib/insforge";

type Estado = EstadoTicket | EstadoOrden | string;

interface BadgeProps {
  estado: Estado;
  className?: string;
}

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  activo: "Activo",
  usado: "Usado",
  aprobado: "Aprobado",
  anulado: "Anulado",
};

const PUNTOS: Record<string, string> = {
  pendiente: "#F59E0B",
  activo: "#10B981",
  usado: "#6B7280",
  aprobado: "#10B981",
  anulado: "#EF4444",
};

export default function Badge({ estado, className = "" }: BadgeProps) {
  const claseEstado = `badge badge-${estado}`;
  const colorPunto = PUNTOS[estado] ?? "#6B7280";

  return (
    <span className={`${claseEstado} ${className}`}>
      {/* Punto indicador */}
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: colorPunto,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
