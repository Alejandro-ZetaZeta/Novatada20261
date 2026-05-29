"use client";

// ============================================================
// components/staff/ResumenCaja.tsx
// Historial de transacciones + resumen de caja — solo admin
// Muestra qué staff aprobó cada orden, tickets vendidos
// y el total de dinero que debería estar en caja.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { insforgeCliente } from "@/lib/insforge";

// ── Tipos locales ─────────────────────────────────────────────
interface FilaAuditoria {
  id: string;
  accion: string;
  created_at: string;
  metadata: Record<string, unknown>;
  orden_id: string | null;
  // joins
  ordenes: {
    id: string;
    estado: string;
    monto_total: number;
    lideres: {
      nombre: string;
      cedula: string;
      telefono: string;
    } | null;
    // cuántos tickets tiene la orden
    tickets: { id: string }[];
  } | null;
  staff: {
    nombre: string;
    email: string;
    rol: string;
  } | null;
}

interface Kpis {
  ordenesAprobadas: number;
  ticketsVendidos: number;
  montoEnCaja: number;
  ordenesPendientes: number;
  montoPendiente: number;
}

// ── Helpers ───────────────────────────────────────────────────
function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ETIQUETA_ACCION: Record<string, string> = {
  aprobado: "Aprobación",
  anulado: "Anulación",
  ingreso_confirmado: "Ingreso en puerta",
  venta_rapida: "Venta rápida",
};

const COLOR_ACCION: Record<string, string> = {
  aprobado: "#065F46",
  anulado: "#991B1B",
  ingreso_confirmado: "#1E3A8A",
  venta_rapida: "#5B21B6",
};

const BG_ACCION: Record<string, string> = {
  aprobado: "rgba(5, 150, 105, 0.08)",
  anulado: "rgba(220, 38, 38, 0.08)",
  ingreso_confirmado: "rgba(59, 130, 246, 0.08)",
  venta_rapida: "rgba(124, 58, 237, 0.08)",
};

// ── Componente ────────────────────────────────────────────────
export default function ResumenCaja() {
  const [filas, setFilas] = useState<FilaAuditoria[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      // ── 1. KPIs: órdenes aprobadas ───────────────────────────
      const { data: ordenesData } = await insforgeCliente.database
        .from("ordenes")
        .select("estado, monto_total, tickets(id)");

      if (ordenesData) {
        const aprobadas = (ordenesData as { estado: string; monto_total: number; tickets: { id: string }[] }[])
          .filter((o) => o.estado === "aprobado");
        const pendientes = (ordenesData as { estado: string; monto_total: number; tickets: { id: string }[] }[])
          .filter((o) => o.estado === "pendiente");

        setKpis({
          ordenesAprobadas: aprobadas.length,
          ticketsVendidos: aprobadas.reduce((sum, o) => sum + o.tickets.length, 0),
          montoEnCaja: aprobadas.reduce((sum, o) => sum + Number(o.monto_total), 0),
          ordenesPendientes: pendientes.length,
          montoPendiente: pendientes.reduce((sum, o) => sum + Number(o.monto_total), 0),
        });
      }

      // ── 2. Historial de auditoría ────────────────────────────
      const { data: audData, error } = await insforgeCliente.database
        .from("auditoria")
        .select(`
          id, accion, created_at, metadata, orden_id,
          ordenes (
            id, estado, monto_total,
            lideres ( nombre, cedula, telefono ),
            tickets ( id )
          ),
          staff ( nombre, email, rol )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error cargando auditoría:", error);
        return;
      }

      setFilas((audData as unknown as FilaAuditoria[]) ?? []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Filtros ──────────────────────────────────────────────────
  const filasFiltradas = filas.filter((f) => {
    if (filtroAccion !== "todos" && f.accion !== filtroAccion) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      const lider = f.ordenes?.lideres;
      return (
        lider?.nombre?.toLowerCase().includes(b) ||
        lider?.cedula?.includes(b) ||
        f.staff?.nombre?.toLowerCase().includes(b) ||
        f.orden_id?.toLowerCase().includes(b)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-text)" }}>
          Resumen de Caja
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
          Historial de transacciones, quién aprobó cada orden y el estado financiero del evento.
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      {kpis && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {/* Tickets vendidos */}
          <div className="card-glass" style={{ padding: "20px 24px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
              TICKETS VENDIDOS
            </p>
            <p style={{ color: "var(--color-activo)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.2rem", margin: "0 0 4px", lineHeight: 1 }}>
              {kpis.ticketsVendidos}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
              en {kpis.ordenesAprobadas} orden{kpis.ordenesAprobadas !== 1 ? "es" : ""} aprobada{kpis.ordenesAprobadas !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Monto en caja */}
          <div className="card-glass" style={{ padding: "20px 24px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
              DINERO EN CAJA
            </p>
            <p style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.2rem", margin: "0 0 4px", lineHeight: 1 }}>
              ${kpis.montoEnCaja.toFixed(2)}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
              recaudado confirmado
            </p>
          </div>

          {/* Órdenes pendientes */}
          <div className="card-glass" style={{ padding: "20px 24px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
              POR COBRAR
            </p>
            <p style={{ color: "var(--color-pendiente)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.2rem", margin: "0 0 4px", lineHeight: 1 }}>
              ${kpis.montoPendiente.toFixed(2)}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
              {kpis.ordenesPendientes} orden{kpis.ordenesPendientes !== 1 ? "es" : ""} pendiente{kpis.ordenesPendientes !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Total potencial */}
          <div className="card-glass" style={{ padding: "20px 24px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
              TOTAL POTENCIAL
            </p>
            <p style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.2rem", margin: "0 0 4px", lineHeight: 1 }}>
              ${(kpis.montoEnCaja + kpis.montoPendiente).toFixed(2)}
            </p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
              si todas las pendientes se aprueban
            </p>
          </div>
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          className="input-field"
          placeholder="Buscar por líder, cédula o staff..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          id="input-busqueda-caja"
          style={{ flex: 1, minWidth: "200px" }}
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["todos", "aprobado", "anulado", "venta_rapida", "ingreso_confirmado"].map((accion) => (
            <button
              key={accion}
              className={filtroAccion === accion ? "btn-primary" : "btn-ghost"}
              onClick={() => setFiltroAccion(accion)}
              style={{ padding: "8px 14px", fontSize: "0.8rem" }}
              id={`btn-filtro-accion-${accion}`}
            >
              {accion === "todos" ? "Todos" : ETIQUETA_ACCION[accion] ?? accion}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de transacciones ────────────────────────────── */}
      {cargando ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : filasFiltradas.length === 0 ? (
        <div className="card-glass" style={{ padding: "48px", textAlign: "center" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1} style={{ width: 48, height: 48, margin: "0 auto 16px" }}>
            <path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 0 1 0 10h-2" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <p style={{ color: "var(--color-text-muted)" }}>No hay transacciones en este filtro.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filasFiltradas.map((fila) => {
            const lider = fila.ordenes?.lideres;
            const cantTickets = fila.ordenes?.tickets?.length ?? 0;
            const monto = fila.ordenes?.monto_total ?? 0;
            const bgAccion = BG_ACCION[fila.accion] ?? "rgba(124,58,237,0.06)";
            const colorAccion = COLOR_ACCION[fila.accion] ?? "var(--color-primary)";

            return (
              <div
                key={fila.id}
                className="card-glass"
                style={{
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {/* Badge de acción */}
                <div style={{
                  padding: "6px 12px",
                  background: bgAccion,
                  borderRadius: "8px",
                  border: `1px solid ${colorAccion}30`,
                  minWidth: "120px",
                  textAlign: "center",
                }}>
                  <p style={{ color: colorAccion, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.78rem", margin: 0 }}>
                    {ETIQUETA_ACCION[fila.accion] ?? fila.accion}
                  </p>
                </div>

                {/* Info del líder y quién lo procesó */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px", flexWrap: "wrap" }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)", margin: 0, fontSize: "0.92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lider?.nombre ?? <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>Sin líder</span>}
                    </p>
                    {cantTickets > 0 && (
                      <span style={{
                        fontSize: "0.65rem",
                        background: "rgba(124, 58, 237, 0.1)",
                        color: "var(--color-primary)",
                        border: "1px solid var(--color-border)",
                        padding: "1px 7px",
                        borderRadius: "100px",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {cantTickets} ticket{cantTickets !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.76rem", margin: 0 }}>
                    {lider?.cedula ? `CC: ${lider.cedula} · ` : ""}
                    {/* Quién del staff procesó */}
                    <span style={{ fontWeight: 500, color: "var(--color-primary-light)" }}>
                      {fila.staff
                        ? `${fila.staff.nombre}${fila.staff.rol === "admin" ? " (Admin)" : ""}`
                        : "Sistema"}
                    </span>
                    {" · "}
                    {formatearFecha(fila.created_at)}
                  </p>
                </div>

                {/* Monto */}
                {monto > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{
                      color: fila.accion === "anulado" ? "var(--color-anulado)" : "var(--color-accent)",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      margin: 0,
                      textDecoration: fila.accion === "anulado" ? "line-through" : "none",
                      opacity: fila.accion === "anulado" ? 0.6 : 1,
                    }}>
                      ${Number(monto).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Estado de la orden */}
                {fila.ordenes?.estado && (
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      fontSize: "0.68rem",
                      padding: "3px 9px",
                      borderRadius: "100px",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 600,
                      background: fila.ordenes.estado === "aprobado"
                        ? "rgba(5,150,105,0.1)"
                        : fila.ordenes.estado === "anulado"
                        ? "rgba(220,38,38,0.1)"
                        : "rgba(217,119,6,0.1)",
                      color: fila.ordenes.estado === "aprobado"
                        ? "#065F46"
                        : fila.ordenes.estado === "anulado"
                        ? "#991B1B"
                        : "#92400E",
                      border: `1px solid ${
                        fila.ordenes.estado === "aprobado"
                          ? "rgba(5,150,105,0.25)"
                          : fila.ordenes.estado === "anulado"
                          ? "rgba(220,38,38,0.25)"
                          : "rgba(217,119,6,0.25)"
                      }`,
                    }}>
                      {fila.ordenes.estado}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pie de página */}
      {!cargando && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>
            {filasFiltradas.length} registro{filasFiltradas.length !== 1 ? "s" : ""} mostrado{filasFiltradas.length !== 1 ? "s" : ""}
          </p>
          <button
            className="btn-ghost"
            onClick={cargarDatos}
            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            id="btn-refrescar-caja"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
