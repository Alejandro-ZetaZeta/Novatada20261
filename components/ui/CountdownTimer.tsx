"use client";

// ============================================================
// components/ui/CountdownTimer.tsx — Cuenta Regresiva
// ============================================================
// Muestra días, horas, minutos y segundos hasta el evento.
// Se actualiza cada segundo en el cliente.
// ============================================================

import { useState, useEffect } from "react";
import { FECHA_EVENTO } from "@/lib/insforge";

interface TiempoRestante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  terminado: boolean;
}

function calcularTiempoRestante(): TiempoRestante {
  const ahora = new Date().getTime();
  const evento = FECHA_EVENTO.getTime();
  const diferencia = evento - ahora;

  if (diferencia <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true };
  }

  return {
    dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((diferencia % (1000 * 60)) / 1000),
    terminado: false,
  };
}

interface UnidadProps {
  valor: number;
  etiqueta: string;
}

function Unidad({ valor, etiqueta }: UnidadProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          background: "rgba(139, 92, 246, 0.1)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          borderRadius: "12px",
          padding: "16px 20px",
          minWidth: "72px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 700,
            color: "var(--color-neon)",
            display: "block",
            lineHeight: 1,
            textShadow: "var(--glow-neon)",
          }}
        >
          {String(valor).padStart(2, "0")}
        </span>
      </div>
      <span
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-muted)",
          marginTop: "8px",
          fontFamily: "var(--font-heading)",
        }}
      >
        {etiqueta}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [tiempo, setTiempo] = useState<TiempoRestante>(calcularTiempoRestante());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempo(calcularTiempoRestante());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  if (tiempo.terminado) {
    return (
      <div style={{ textAlign: "center", padding: "16px" }}>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-activo)",
          }}
          className="animar-parpadeo"
        >
          ¡El evento ha comenzado!
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(8px, 3vw, 24px)",
        alignItems: "flex-start",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <Unidad valor={tiempo.dias} etiqueta="días" />
      <div style={{ color: "var(--color-primary)", fontSize: "2rem", paddingTop: "12px" }}>:</div>
      <Unidad valor={tiempo.horas} etiqueta="horas" />
      <div style={{ color: "var(--color-primary)", fontSize: "2rem", paddingTop: "12px" }}>:</div>
      <Unidad valor={tiempo.minutos} etiqueta="min" />
      <div style={{ color: "var(--color-primary)", fontSize: "2rem", paddingTop: "12px" }}>:</div>
      <Unidad valor={tiempo.segundos} etiqueta="seg" />
    </div>
  );
}
