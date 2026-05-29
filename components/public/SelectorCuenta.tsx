"use client";

// ============================================================
// components/public/SelectorCuenta.tsx
// Selector visual de cuentas Banco Pichincha
// ============================================================
// Las QR estáticas residen en public/qr/
// La cuenta 2 es placeholder hasta que el usuario la defina.
// ============================================================

import { useState } from "react";
import Image from "next/image";

interface Cuenta {
  id: string;
  numeroCuenta: string;
  titular: string;
  qrPath: string;
}

const CUENTAS: Cuenta[] = [
  {
    id: "cuenta-1",
    numeroCuenta: "2214765254",
    titular: "Cristhian Alejandro Zambrano Zambrano",
    qrPath: "/qr/cuenta-1.png",
  },
  {
    id: "cuenta-2",
    numeroCuenta: "2211135976",           // Placeholder — reemplazar con datos reales
    titular: "Cristhian Alejandro Zambrano Zambrano", // Placeholder
    qrPath: "/qr/cuenta-2.png",
  },
];

interface SelectorCuentaProps {
  montoTotal: number;
}

export default function SelectorCuenta({ montoTotal }: SelectorCuentaProps) {
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>(CUENTAS[0].id);
  const [mostrarQR, setMostrarQR] = useState(false);

  const cuenta = CUENTAS.find((c) => c.id === cuentaSeleccionada) ?? CUENTAS[0];

  return (
    <div>
      <p className="input-label" style={{ marginBottom: "12px" }}>
        Selecciona la cuenta a la que transferirás
      </p>

      {/* Selector de cuentas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {CUENTAS.map((c) => (
          <button
            key={c.id}
            id={`btn-${c.id}`}
            onClick={() => setCuentaSeleccionada(c.id)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${cuentaSeleccionada === c.id ? "var(--color-primary)" : "var(--color-border)"}`,
              background: cuentaSeleccionada === c.id
                ? "rgba(139, 92, 246, 0.12)"
                : "rgba(139, 92, 246, 0.03)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              boxShadow: cuentaSeleccionada === c.id ? "var(--glow-primary)" : "none",
            }}
          >
            {/* Logo Banco Pichincha */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  background: "#FFB800",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#1A1A1A", fontSize: "0.7rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>BP</span>
              </div>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-heading)" }}>
                Banco Pichincha
              </span>
            </div>
            <p style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "2px" }}>
              {c.numeroCuenta}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", lineHeight: 1.3 }}>
              {c.titular.split(" ").slice(0, 2).join(" ")}
            </p>
          </button>
        ))}
      </div>

      {/* Detalle de la cuenta seleccionada */}
      <div
        style={{
          padding: "14px",
          background: "rgba(255, 184, 0, 0.05)",
          border: "1px solid rgba(255, 184, 0, 0.15)",
          borderRadius: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
          <div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", marginBottom: "2px" }}>
              TITULAR
            </p>
            <p style={{ color: "var(--color-text)", fontSize: "0.9rem", fontWeight: 500 }}>
              {cuenta.titular}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", marginTop: "6px", marginBottom: "2px" }}>
              N° DE CUENTA
            </p>
            <p style={{ color: "var(--color-text)", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.05em" }}>
              {cuenta.numeroCuenta}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", marginBottom: "2px" }}>
              MONTO A TRANSFERIR
            </p>
            <p style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700 }}>
              ${montoTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Botón ver QR */}
      <button
        className="btn-ghost"
        onClick={() => setMostrarQR(!mostrarQR)}
        style={{ width: "100%", justifyContent: "center", gap: "8px" }}
        id={`btn-ver-qr-${cuenta.id}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 22h.01" />
        </svg>
        {mostrarQR ? "Ocultar QR" : "Ver código QR para transferencia"}
      </button>

      {/* QR estático */}
      {mostrarQR && (
        <div
          className="animar-aparecer"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: "8px" }}
        >
          <div
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "12px",
              display: "inline-block",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <Image
              src={cuenta.qrPath}
              alt={`QR Banco Pichincha ${cuenta.numeroCuenta}`}
              width={200}
              height={200}
              style={{ display: "block", borderRadius: "4px" }}
              onError={(e) => {
                // Placeholder si el QR aún no está
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", textAlign: "center" }}>
            Escanea con tu app bancaria para transferir exactamente ${montoTotal.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
