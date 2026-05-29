"use client";

// ============================================================
// components/public/ConsultarEstado.tsx
// Sección de consulta de estado por cédula (visitante)
// ============================================================

import { useState } from "react";
import { validarCedula } from "@/lib/validar-cedula";
import Badge from "@/components/ui/Badge";

interface ResultadoTicket {
  estado_ticket: string;
  es_lider: boolean;
  estado_orden: string;
  fecha_compra: string;
}

interface ResultadoConsulta {
  encontrado: boolean;
  mensaje?: string;
  cedula?: string;
  tickets?: ResultadoTicket[];
}

export default function ConsultarEstado() {
  const [cedula, setCedula] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  const [error, setError] = useState("");

  async function consultar() {
    const cedLimpia = cedula.trim();
    const validacion = validarCedula(cedLimpia);
    if (!validacion.valida) {
      setError(validacion.error!);
      return;
    }

    setError("");
    setCargando(true);
    setResultado(null);

    try {
      const res = await fetch(`/api/tickets/estado?cedula=${cedLimpia}`);
      const datos = await res.json();

      if (!res.ok) {
        setError(datos.error ?? "Error al consultar.");
        return;
      }

      setResultado(datos);
    } catch {
      setError("Error de red. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  function formatearFecha(fechaISO: string): string {
    return new Date(fechaISO).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="card-glass" style={{ padding: "clamp(20px, 4vw, 36px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(124, 58, 237, 0.08)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth={2} style={{ width: 20, height: 20 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)", margin: 0, fontSize: "1.1rem" }}>
            Consultar mi estado
          </h3>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.85rem" }}>
            Ingresa tu cédula para ver el estado de tu entrada
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          id="input-consulta-cedula"
          type="text"
          inputMode="numeric"
          maxLength={10}
          className={`input-field ${error ? "error" : ""}`}
          placeholder="Tu número de cédula"
          value={cedula}
          onChange={(e) => {
            setCedula(e.target.value.replace(/\D/g, ""));
            setError("");
            setResultado(null);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") consultar(); }}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={consultar}
          disabled={cargando || cedula.length !== 10}
          id="btn-consultar-estado"
          style={{ whiteSpace: "nowrap" }}
        >
          {cargando ? <span className="spinner" /> : (
            <>
              Consultar
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {error && (
        <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "8px" }}>{error}</p>
      )}

      {/* Resultado */}
      {resultado && !resultado.encontrado && (
        <div
          className="animar-aparecer"
          style={{
            marginTop: "16px",
            padding: "14px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "10px",
          }}
        >
          <p style={{ color: "#92400E", fontSize: "0.9rem", margin: 0 }}>
            No se encontraron entradas para la cédula <strong>{cedula}</strong>.
            Si realizaste tu compra recientemente, puede tardar unos minutos en reflejarse.
          </p>
        </div>
      )}

      {resultado?.encontrado && resultado.tickets && (
        <div className="animar-aparecer" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {resultado.tickets.map((ticket, i) => (
            <div
              key={i}
              style={{
                padding: "14px",
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Badge estado={ticket.estado_ticket} />
                  {ticket.es_lider && (
                    <span style={{ fontSize: "0.65rem", background: "var(--color-primary)", color: "white", padding: "2px 8px", borderRadius: "100px", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      LÍDER
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
                  Compra: {formatearFecha(ticket.fecha_compra)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>Orden</p>
                <Badge estado={ticket.estado_orden} />
              </div>
            </div>
          ))}

          {/* Mensaje según estado */}
          {resultado.tickets[0]?.estado_ticket === "pendiente" && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                borderRadius: "8px",
                fontSize: "0.82rem",
                color: "#92400E",
              }}
            >
              Tu comprobante está en revisión. Recibirás tu ticket por WhatsApp al ser aprobado.
            </div>
          )}
          {resultado.tickets[0]?.estado_ticket === "activo" && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "8px",
                fontSize: "0.82rem",
                color: "#065F46",
              }}
            >
              ¡Tu entrada está activa! Revisa el enlace que te enviamos por WhatsApp.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
