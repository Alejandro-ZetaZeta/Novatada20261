"use client";

// ============================================================
// components/staff/ModalDetalle.tsx
// Modal de detalle de orden para staff
// Muestra comprobante (URL firmada InsForge) + acciones
// ============================================================

import { useState, useEffect } from "react";
import { insforgeCliente, obtenerSesionActual } from "@/lib/insforge";
import type { Orden } from "@/lib/insforge";
import Badge from "@/components/ui/Badge";
import { generarUrlWhatsApp } from "@/lib/whatsapp";

interface ModalDetalleProps {
  orden: Orden;
  rol: "staff" | "admin";
  onCerrar: () => void;
  onAprobada: () => void;
}

interface TicketResumen {
  id: string;
  cedula_asistente: string;
  estado: string;
  es_lider: boolean;
}

export default function ModalDetalle({ orden, rol, onCerrar, onAprobada }: ModalDetalleProps) {
  const [tickets, setTickets] = useState<TicketResumen[]>([]);
  const [urlComprobante, setUrlComprobante] = useState<string | null>(null);
  const [aprobando, setAprobando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [error, setError] = useState("");

  // Limpiar blob URL al desmontar para evitar memory leaks
  useEffect(() => {
    return () => {
      if (urlComprobante?.startsWith("blob:")) {
        URL.revokeObjectURL(urlComprobante);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cargar tickets y comprobante ──────────────────────────
  useEffect(() => {
    async function cargar() {
      // Cargar tickets del grupo
      const { data } = await insforgeCliente.database
        .from("tickets")
        .select("id, cedula_asistente, estado, es_lider")
        .eq("orden_id", orden.id)
        .order("es_lider", { ascending: false });

      setTickets((data as TicketResumen[]) ?? []);

      // Obtener imagen a través del proxy server-side (el bucket es privado).
      // La ruta /api/storage/signed-url descarga el blob con la service key
      // y lo devuelve directamente — no hay 401 en el navegador.
      if (orden.comprobante_key) {
        const sesion = await obtenerSesionActual();
        if (sesion) {
          // Construir la URL del proxy pasando el token en el header via fetch,
          // pero <Image> de Next.js no soporta headers — usamos un blob URL local.
          const res = await fetch(
            `/api/storage/signed-url?key=${encodeURIComponent(orden.comprobante_key)}`,
            { headers: { Authorization: `Bearer ${sesion.accessToken}` } }
          );
          if (res.ok) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            setUrlComprobante(objectUrl);
          }
        }
      }
    }
    cargar();
  }, [orden]);

  // ── Aprobar orden ─────────────────────────────────────────
  async function aprobarOrden() {
    setError("");
    setAprobando(true);

    try {
      const sesion = await obtenerSesionActual();
      if (!sesion) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }

      const res = await fetch(`/api/ordenes/${orden.id}/aprobar`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${sesion.accessToken}`,
        },
      });

      const datos = await res.json();

      if (!res.ok) {
        setError(datos.error ?? "Error al aprobar la orden.");
        return;
      }

      // Buscar el ticket del líder para el enlace WhatsApp
      const ticketLider = tickets.find((t) => t.es_lider);

      if (ticketLider && orden.lideres?.telefono) {
        const urlWA = generarUrlWhatsApp(
          orden.lideres.telefono,
          orden.lideres.nombre,
          ticketLider.id,
          tickets.length
        );

        // Redirigir a WhatsApp (el staff presiona enviar)
        window.open(urlWA, "_blank", "noopener,noreferrer");
      }

      onAprobada();
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setAprobando(false);
    }
  }

  // ── Anular orden ──────────────────────────────────────────
  async function anularOrden() {
    if (!confirm("¿Estás seguro de anular esta orden? Esta acción queda registrada en auditoría.")) return;
    setAnulando(true);

    try {
      const sesion = await obtenerSesionActual();
      if (!sesion) { setError("Sesión expirada."); return; }

      const res = await fetch(`/api/ordenes/${orden.id}/anular`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${sesion.accessToken}` },
      });

      if (res.ok) {
        onAprobada(); // Recargar lista
      } else {
        const datos = await res.json();
        setError(datos.error ?? "Error al anular.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setAnulando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal-content" style={{ maxWidth: "640px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
            Detalle de Orden
          </h3>
          <button
            onClick={onCerrar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}
            aria-label="Cerrar modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Datos del líder */}
        <div
          style={{
            padding: "16px",
            background: "rgba(139, 92, 246, 0.06)",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", margin: "0 0 2px" }}>LÍDER</p>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text)", margin: 0 }}>
                {orden.lideres?.nombre}
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                CC: {orden.lideres?.cedula} · Tel: {orden.lideres?.telefono}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <Badge estado={orden.estado} />
              <p style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.4rem", margin: "4px 0 0" }}>
                ${Number(orden.monto_total).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Comprobante */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", marginBottom: "10px" }}>COMPROBANTE DE TRANSFERENCIA</p>

          {urlComprobante ? (
            <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
              {/* Usamos <img> nativo porque urlComprobante es un blob: URL
                  que Next.js <Image> no soporta */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlComprobante}
                alt="Comprobante de transferencia"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          ) : orden.num_referencia ? (
            <div
              style={{
                padding: "14px",
                background: "rgba(139, 92, 246, 0.05)",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              {[
                { label: "Fecha", valor: orden.fecha_transferencia },
                { label: "N° Referencia", valor: orden.num_referencia },
                { label: "Cuenta origen", valor: orden.cuenta_origen },
              ].map((item) => (
                item.valor && (
                  <div key={item.label}>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-heading)", margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ color: "var(--color-text)", fontSize: "0.9rem", margin: 0 }}>{item.valor}</p>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Sin comprobante adjunto (venta en efectivo).</p>
          )}
        </div>

        {/* Tickets del grupo */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", marginBottom: "8px" }}>
            GRUPO ({tickets.length} persona{tickets.length !== 1 ? "s" : ""})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "rgba(139, 92, 246, 0.04)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-text)", letterSpacing: "0.03em" }}>
                    {ticket.cedula_asistente}
                  </span>
                  {ticket.es_lider && (
                    <span style={{ fontSize: "0.6rem", background: "var(--color-primary)", color: "white", padding: "1px 6px", borderRadius: "100px", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      LÍDER
                    </span>
                  )}
                </div>
                <Badge estado={ticket.estado} />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "0.85rem", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Acciones */}
        {orden.estado === "pendiente" && (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn-danger"
              onClick={anularOrden}
              disabled={anulando}
              style={{ flex: 1 }}
              id="btn-anular-orden"
            >
              {anulando ? <span className="spinner" /> : "Anular"}
            </button>
            <button
              className="btn-cta"
              onClick={aprobarOrden}
              disabled={aprobando}
              style={{ flex: 2 }}
              id="btn-aprobar-orden"
            >
              {aprobando ? (
                <><span className="spinner" /> Aprobando...</>
              ) : (
                <>
                  Aprobar y Enviar por WhatsApp
                  <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {orden.estado === "aprobado" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "12px",
                background: "rgba(5, 150, 105, 0.08)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                borderRadius: "10px",
                textAlign: "center",
                color: "#065F46",
                fontSize: "0.9rem",
              }}
            >
              Orden aprobada. Ticket enviado al líder por WhatsApp.
            </div>
            {/* Admin puede anular órdenes aprobadas (p.ej. reembolso) */}
            {rol === "admin" && (
              <button
                className="btn-danger"
                onClick={anularOrden}
                disabled={anulando}
                style={{ width: "100%" }}
                id="btn-anular-aprobada"
              >
                {anulando ? <span className="spinner" /> : "Anular orden aprobada (Admin)"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
