// ============================================================
// app/ticket/[uuid]/page.tsx — Página del Ticket Virtual
// Accesible por el líder vía el enlace de WhatsApp
// ============================================================

import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import QRCode from "@/components/ui/QRCodeWrapper";

interface TicketPublico {
  uuid: string;
  estado: string;
  estado_orden: string;
  nombre_lider: string;
  cantidad_personas: number;
  fecha_compra: string;
  asistentes: Array<{
    cedula_masked: string;
    es_lider: boolean;
    estado: string;
  }>;
}

interface Props {
  params: Promise<{ uuid: string }>;
}

async function obtenerDatosTicket(uuid: string): Promise<TicketPublico | null> {
  // En Vercel: NEXT_PUBLIC_BASE_URL se configura en el Dashboard.
  // VERCEL_URL es automático (sin https://). Fallback final: localhost para dev.
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  try {
    const res = await fetch(`${baseUrl}/api/tickets/${uuid}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uuid } = await params;
  const ticket = await obtenerDatosTicket(uuid);

  if (!ticket) {
    return { title: "Ticket no encontrado — Novatada ULEAM 2026" };
  }

  return {
    title: `Entrada de ${ticket.nombre_lider} — Novatada ULEAM 2026`,
    description: `Ticket digital para la Novatada ULEAM 2026. Grupo de ${ticket.cantidad_personas} persona(s). Estado: ${ticket.estado}.`,
  };
}

function formatearFecha(fechaISO: string): string {
  return new Date(fechaISO).toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PaginaTicket({ params }: Props) {
  const { uuid } = await params;
  const ticket = await obtenerDatosTicket(uuid);

  // ── Error: ticket no encontrado ───────────────────────────
  if (!ticket) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          className="card-glass"
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.5} style={{ width: 56, height: 56, margin: "0 auto 16px" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)", marginBottom: "8px" }}>
            Ticket no encontrado
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            El enlace no es válido o el ticket no existe. Contacta al staff de la asociación.
          </p>
        </div>
      </main>
    );
  }

  // ── Render del ticket ─────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Header del ticket */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.07), rgba(167, 139, 250, 0.04))",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            borderRadius: "20px 20px 0 0",
            padding: "24px",
            textAlign: "center",
            borderBottom: "2px dashed rgba(124, 58, 237, 0.15)",
          }}
        >
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Asociación de Estudiantes Uleam Chone
          </p>
          <h1
            className="text-gradient"
            style={{ fontSize: "1.6rem", marginBottom: "4px" }}
          >
            Novatada ULEAM 2026
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            31 de Julio de 2026
          </p>
        </div>

        {/* Cuerpo del ticket */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            borderTop: "none",
            borderRadius: "0 0 20px 20px",
            padding: "24px",
            marginTop: "-2px",
          }}
        >
          {/* Datos del líder */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                  Líder del grupo
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.2rem",
                    color: "var(--color-text)",
                    margin: 0,
                  }}
                >
                  {ticket.nombre_lider}
                </h2>
              </div>
              <Badge estado={ticket.estado} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(124, 58, 237, 0.05)",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-heading)", margin: "0 0 2px" }}>PERSONAS</p>
                <p style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.3rem", margin: 0 }}>
                  {ticket.cantidad_personas}
                </p>
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(124, 58, 237, 0.05)",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-heading)", margin: "0 0 2px" }}>COMPRA</p>
                <p style={{ color: "var(--color-text)", fontSize: "0.8rem", margin: 0 }}>
                  {formatearFecha(ticket.fecha_compra)}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de asistentes */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Grupo de asistentes
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {ticket.asistentes.map((asistente, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: asistente.es_lider
                      ? "rgba(124, 58, 237, 0.08)"
                      : "rgba(255, 255, 255, 0.6)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={2} style={{ width: 14, height: 14 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-text)", letterSpacing: "0.05em" }}>
                      {asistente.cedula_masked}
                    </span>
                    {asistente.es_lider && (
                      <span style={{ fontSize: "0.65rem", background: "var(--color-primary)", color: "white", padding: "1px 6px", borderRadius: "100px", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                        LÍDER
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separador con perforaciones */}
          <div
            style={{
              position: "relative",
              height: "1px",
              background: "repeating-linear-gradient(90deg, rgba(124, 58, 237, 0.2) 0, rgba(124, 58, 237, 0.2) 6px, transparent 6px, transparent 10px)",
              margin: "20px 0",
            }}
          />

          {/* QR Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <QRCode
              uuid={ticket.uuid}
              estado={ticket.estado}
              tamaño={180}
            />

            {ticket.estado === "activo" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", maxWidth: "280px" }}>
                  Presenta este código QR en la entrada el <strong style={{ color: "var(--color-text)" }}>31 de julio</strong>. El staff lo escaneará para validar tu grupo.
                </p>
              </div>
            )}

            {ticket.estado === "pendiente" && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#92400E", fontSize: "0.82rem", margin: 0 }}>
                  Tu pago está siendo verificado. El código QR aparecerá aquí cuando sea aprobado.
                </p>
              </div>
            )}

            {ticket.estado === "usado" && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(107, 114, 128, 0.08)",
                  border: "1px solid rgba(107, 114, 128, 0.2)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#9CA3AF", fontSize: "0.82rem", margin: 0 }}>
                  Este ticket ya fue utilizado. ¡Esperamos que disfrutes el evento!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nota de seguridad */}
        <p
          style={{
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.72rem",
            lineHeight: 1.5,
          }}
        >
          Ticket digital único e intransferible. El QR es válido solo para este grupo.
          <br />
          No compartas capturas de pantalla — se verifica físicamente la cédula en la puerta.
        </p>
      </div>
    </main>
  );
}
