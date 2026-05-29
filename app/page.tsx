// ============================================================
// app/page.tsx — Página Principal (Index Público)
// Novatada ULEAM 2026
// ============================================================

import type { Metadata } from "next";
import ConsultarEstado from "@/components/public/ConsultarEstado";
import FormularioCompra from "@/components/public/FormularioCompra";
import CountdownTimer from "@/components/ui/CountdownTimerWrapper";

export const metadata: Metadata = {
  title: "Novatada ULEAM 2026 — Adquiere tu Entrada Digital",
  description:
    "Compra tu entrada para la Novatada ULEAM Chone 2026. Precio de preventa $3. Sistema seguro de tickets digitales con código QR.",
};

export default function PaginaPrincipal() {
  return (
    <main>
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: "12px",
          zIndex: 40,
          margin: "12px 16px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "rgba(250, 245, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            borderRadius: "16px",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Logo/ícono */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-neon))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.327-.036.950-.093 1.271-.415.247-.249.152-.611-.134-.716a3.37 3.37 0 00-.33-.087 20.16 20.16 0 01-3.048-.64c-.624-.178-1.254-.418-1.65-.962-.16-.22-.217-.521-.033-.725.179-.2.482-.21.733-.161.517.1 1.001.36 1.508.503.672.19 1.363.293 2.054.369.905.099 1.806.136 2.71.024.498-.061.985-.18 1.453-.353.328-.123.655-.302.877-.578.281-.351.267-.845.05-1.221z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text)", margin: 0, lineHeight: 1.2 }}>
                Novatada ULEAM 2026
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", margin: 0 }}>
                Asociación de Estudiantes
              </p>
            </div>
          </div>
          <a
            href="/staff/login"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.8rem",
              textDecoration: "none",
              fontFamily: "var(--font-heading)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              transition: "all 0.2s ease",
            }}
            id="link-staff-login"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Staff
          </a>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        className="section"
        style={{ paddingTop: "80px", paddingBottom: "60px", textAlign: "center" }}
      >
        <div className="container-main">
          {/* Badge evento */}
          <div
            className="animar-aparecer"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}
          >
            <span
              style={{
                background: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                borderRadius: "100px",
                padding: "6px 16px",
                fontFamily: "var(--font-heading)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--color-activo)",
                  display: "inline-block",
                  animation: "pulso-activo 2s ease-in-out infinite",
                }}
              />
              31 de Julio de 2026 · Preventa $3
            </span>
          </div>

          {/* Título principal */}
          <h1
            className="animar-aparecer delay-100 text-gradient"
            style={{ marginBottom: "16px" }}
          >
            Novatada
            <br />
            ULEAM Chone 2026
          </h1>

          <p
            className="animar-aparecer delay-200"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              maxWidth: "560px",
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            La fiesta universitaria más esperada del año. Adquiere tu entrada digital ahora al precio de preventa.
          </p>

          {/* Countdown */}
          <div className="animar-aparecer delay-300" style={{ marginBottom: "16px" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              Faltan
            </p>
            <CountdownTimer />
          </div>
        </div>
      </section>

      <div className="divider-neon" />

      {/* ── CONTENIDO PRINCIPAL ────────────────────────────── */}
      <section className="section">
        <div className="container-main">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))",
              gap: "clamp(24px, 4vw, 48px)",
              alignItems: "start",
            }}
          >
            {/* ── Columna izquierda: Adquirir entrada ─────── */}
            <div>
              {/* Encabezado de sección */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-neon))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 16, height: 16 }}>
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" />
                    </svg>
                  </div>
                  <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Adquirir Entrada</h2>
                </div>
                <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
                  Puedes comprar hasta 10 entradas grupales. Precio de preventa: <strong style={{ color: "var(--color-accent)" }}>$3 por persona</strong>.
                </p>
              </div>

              <FormularioCompra />

              {/* Info adicional */}
              <div
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                {[
                  { icono: "🎟️", titulo: "Preventa", desc: "$3 por persona" },
                  { icono: "👥", titulo: "Grupal", desc: "Hasta 10 personas" },
                  { icono: "📱", titulo: "Digital", desc: "Ticket por WhatsApp" },
                  { icono: "🔒", titulo: "Seguro", desc: "QR único e infalsiable" },
                ].map((item) => (
                  <div
                    key={item.titulo}
                    style={{
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.7)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{item.icono}</span>
                    <div>
                      <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text)" }}>{item.titulo}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Columna derecha: Consultar estado ───────── */}
            <div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(124, 58, 237, 0.08)",
                      border: "1px solid rgba(124, 58, 237, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={2} style={{ width: 16, height: 16 }}>
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                  <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Estado de mi Entrada</h2>
                </div>
                <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
                  Si ya compraste tu entrada, verifica aquí el estado de aprobación.
                </p>
              </div>

              <ConsultarEstado />

              {/* Info de proceso */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                }}
              >
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)", marginBottom: "16px" }}>
                  ¿Cómo funciona?
                </p>
                {[
                  { paso: "1", texto: "Completa el formulario y sube tu comprobante de transferencia." },
                  { paso: "2", texto: "El staff valida tu pago en la cuenta Banco Pichincha." },
                  { paso: "3", texto: "Recibes tu ticket digital por WhatsApp con código QR." },
                  { paso: "4", texto: "Presenta el QR en la puerta el 31 de julio." },
                ].map((item) => (
                  <div key={item.paso} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "rgba(124, 58, 237, 0.08)",
                        border: "1px solid var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-primary-light)",
                      }}
                    >
                      {item.paso}
                    </div>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                      {item.texto}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--color-border)", paddingTop: "32px", paddingBottom: "32px", marginTop: "40px" }}>
        <div className="container-main" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
            Asociación de Estudiantes Uleam Chone · Novatada 2026
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
            Sistema de tickets digitales seguro. Los tickets QR son únicos e intransferibles.
          </p>
        </div>
      </footer>
    </main>
  );
}
