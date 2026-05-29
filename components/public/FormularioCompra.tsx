"use client";

// ============================================================
// components/public/FormularioCompra.tsx
// Formulario multi-paso para adquirir entradas
// ============================================================
// Pasos:
// 1. Datos del líder (nombre, teléfono, cédula)
// 2. Cédulas del grupo (+ cálculo de precio en vivo)
// 3. Selección de cuenta Pichincha + comprobante
// 4. Confirmación con enlace al ticket
// ============================================================

import { useState } from "react";
import { validarCedula, validarTelefono } from "@/lib/validar-cedula";
import { PRECIO_PREVENTA } from "@/lib/insforge";
import SelectorCuenta from "@/components/public/SelectorCuenta";
import SubirComprobante from "@/components/public/SubirComprobante";

// ── Tipos ────────────────────────────────────────────────────
interface DatosLider {
  nombre: string;
  telefono: string;
  cedula: string;
}

interface DatosComprobante {
  tipo: "imagen" | "texto";
  comprobante_url?: string;
  comprobante_key?: string;
  fecha_transferencia?: string;
  num_referencia?: string;
  cuenta_origen?: string;
}

type Paso = 1 | 2 | 3 | 4;

// ── Componente Principal ─────────────────────────────────────
export default function FormularioCompra() {
  const [paso, setPaso] = useState<Paso>(1);
  const [lider, setLider] = useState<DatosLider>({ nombre: "", telefono: "", cedula: "" });
  const [cedulas, setCedulas] = useState<string[]>([]);
  const [cedulaTemp, setCedulaTemp] = useState("");
  const [comprobante, setComprobante] = useState<DatosComprobante | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [ticketUUID, setTicketUUID] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // ── Precio en tiempo real ─────────────────────────────────
  // Las cédulas del grupo incluyen la del líder
  const totalPersonas = cedulas.includes(lider.cedula) ? cedulas.length : cedulas.length + 1;
  const montoTotal = totalPersonas * PRECIO_PREVENTA;

  // ── Validación Paso 1 ─────────────────────────────────────
  function validarPaso1(): boolean {
    const nuevosErrores: Record<string, string> = {};

    if (!lider.nombre.trim() || lider.nombre.trim().length < 3) {
      nuevosErrores.nombre = "Ingrese su nombre completo (mín. 3 caracteres).";
    }

    const resTelefono = validarTelefono(lider.telefono);
    if (!resTelefono.valida) {
      nuevosErrores.telefono = resTelefono.error!;
    }

    const resCedula = validarCedula(lider.cedula);
    if (!resCedula.valida) {
      nuevosErrores.cedula = resCedula.error!;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  // ── Agregar cédula al grupo ───────────────────────────────
  function agregarCedula() {
    const cedula = cedulaTemp.trim();
    const res = validarCedula(cedula);
    if (!res.valida) {
      setErrores({ ...errores, cedulaTemp: res.error! });
      return;
    }
    if (cedulas.includes(cedula)) {
      setErrores({ ...errores, cedulaTemp: "Esta cédula ya está en la lista." });
      return;
    }
    if (cedula === lider.cedula) {
      setErrores({ ...errores, cedulaTemp: "La cédula del líder se agrega automáticamente." });
      return;
    }
    if (cedulas.length >= 9) {
      setErrores({ ...errores, cedulaTemp: "Máximo 10 personas por grupo (incluyendo al líder)." });
      return;
    }
    setCedulas([...cedulas, cedula]);
    setCedulaTemp("");
    setErrores({ ...errores, cedulaTemp: "" });
  }

  function quitarCedula(cedula: string) {
    setCedulas(cedulas.filter((c) => c !== cedula));
  }

  // ── Enviar formulario ─────────────────────────────────────
  async function enviarOrden() {
    if (!comprobante) {
      setErrorGeneral("Debe subir o ingresar los datos del comprobante.");
      return;
    }

    setCargando(true);
    setErrorGeneral(null);

    // La lista final incluye la cédula del líder
    const todasLasCedulas = cedulas.includes(lider.cedula)
      ? cedulas
      : [lider.cedula, ...cedulas];

    try {
      const respuesta = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lider,
          cedulas: todasLasCedulas,
          comprobante_url: comprobante.comprobante_url,
          comprobante_key: comprobante.comprobante_key,
          fecha_transferencia: comprobante.fecha_transferencia,
          num_referencia: comprobante.num_referencia,
          cuenta_origen: comprobante.cuenta_origen,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorGeneral(datos.error ?? "Error al procesar la orden.");
        return;
      }

      setTicketUUID(datos.ticket_lider_uuid);
      setPaso(4);
    } catch {
      setErrorGeneral("Error de red. Por favor intente nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  // ── Indicador de pasos ────────────────────────────────────
  function IndicadorPasos() {
    const pasos = [
      { num: 1, label: "Tus datos" },
      { num: 2, label: "Tu grupo" },
      { num: 3, label: "Pago" },
      { num: 4, label: "¡Listo!" },
    ];

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "32px" }}>
        {pasos.map((p, i) => (
          <div key={p.num} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  background: paso >= p.num
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))"
                    : "rgba(124, 58, 237, 0.07)",
                  color: paso >= p.num ? "white" : "var(--color-text-muted)",
                  border: paso >= p.num ? "none" : "1px solid var(--color-border)",
                  transition: "all 0.3s ease",
                  boxShadow: paso === p.num ? "var(--glow-primary)" : "none",
                }}
              >
                {paso > p.num ? (
                  // Check SVG
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : p.num}
              </div>
              <span style={{ fontSize: "0.65rem", color: paso >= p.num ? "var(--color-primary-light)" : "var(--color-text-muted)", fontFamily: "var(--font-heading)", whiteSpace: "nowrap" }}>
                {p.label}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div
                style={{
                  width: "clamp(20px, 5vw, 48px)",
                  height: "1px",
                  background: paso > p.num ? "var(--color-primary)" : "var(--color-border)",
                  marginBottom: "18px",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── PASO 1: Datos del líder ───────────────────────────────
  function Paso1() {
    return (
      <div className="animar-aparecer">
        <h3 style={{ fontFamily: "var(--font-heading)", marginBottom: "24px", color: "var(--color-text)" }}>
          Tus datos personales
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Nombre */}
          <div>
            <label className="input-label" htmlFor="nombre-lider">Nombre completo</label>
            <input
              id="nombre-lider"
              type="text"
              className={`input-field ${errores.nombre ? "error" : ""}`}
              placeholder="Ej: María Fernanda García López"
              value={lider.nombre}
              onChange={(e) => setLider({ ...lider, nombre: e.target.value })}
              autoComplete="name"
            />
            {errores.nombre && (
              <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.nombre}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="input-label" htmlFor="telefono-lider">Teléfono (WhatsApp)</label>
            <input
              id="telefono-lider"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className={`input-field ${errores.telefono ? "error" : ""}`}
              placeholder="0987654321"
              value={lider.telefono}
              onChange={(e) => setLider({ ...lider, telefono: e.target.value.replace(/\D/g, "") })}
              autoComplete="tel"
            />
            {errores.telefono
              ? <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.telefono}</p>
              : <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Te enviaremos tu entrada por este número.</p>
            }
          </div>

          {/* Cédula líder */}
          <div>
            <label className="input-label" htmlFor="cedula-lider">Número de cédula</label>
            <input
              id="cedula-lider"
              type="text"
              inputMode="numeric"
              maxLength={10}
              className={`input-field ${errores.cedula ? "error" : validarCedula(lider.cedula).valida ? "success" : ""}`}
              placeholder="0912345678"
              value={lider.cedula}
              onChange={(e) => setLider({ ...lider, cedula: e.target.value.replace(/\D/g, "") })}
            />
            {errores.cedula
              ? <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.cedula}</p>
              : lider.cedula.length === 10 && validarCedula(lider.cedula).valida
                ? <p style={{ color: "var(--color-activo)", fontSize: "0.8rem", marginTop: "4px" }}>✓ Cédula válida</p>
                : <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Validación automática (Módulo 10).</p>
            }
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: "32px" }}
          onClick={() => { if (validarPaso1()) setPaso(2); }}
          id="btn-siguiente-paso1"
        >
          Siguiente: Mi grupo
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // ── PASO 2: Cédulas del grupo ─────────────────────────────
  function Paso2() {
    return (
      <div className="animar-aparecer">
        <h3 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px", color: "var(--color-text)" }}>
          ¿Quiénes vienen contigo?
        </h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
          Ingresa las cédulas de tus acompañantes. Tu cédula ya está incluida.
        </p>

        {/* Líder ya incluido */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "rgba(124, 58, 237, 0.07)",
            borderRadius: "10px",
            marginBottom: "16px",
            border: "1px solid rgba(124, 58, 237, 0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.7rem", background: "var(--color-primary)", color: "white", padding: "2px 8px", borderRadius: "100px", fontFamily: "var(--font-heading)", fontWeight: 600 }}>LÍDER</span>
            <span style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", fontSize: "0.9rem" }}>{lider.cedula}</span>
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{lider.nombre}</span>
        </div>

        {/* Lista de acompañantes */}
        {cedulas.map((cedula, i) => (
          <div
            key={cedula}
            className="animar-aparecer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.65)",
              borderRadius: "10px",
              marginBottom: "8px",
              border: "1px solid var(--color-border)",
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", fontSize: "0.9rem" }}>{cedula}</span>
            <button
              onClick={() => quitarCedula(cedula)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}
              aria-label={`Quitar cédula ${cedula}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* Agregar cédula */}
        {totalPersonas < 10 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              className={`input-field ${errores.cedulaTemp ? "error" : ""}`}
              placeholder="Cédula del acompañante"
              value={cedulaTemp}
              onChange={(e) => setCedulaTemp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") agregarCedula(); }}
              id="input-cedula-acompanante"
              style={{ flex: 1 }}
            />
            <button
              className="btn-ghost"
              onClick={agregarCedula}
              id="btn-agregar-cedula"
              style={{ whiteSpace: "nowrap" }}
            >
              + Agregar
            </button>
          </div>
        )}
        {errores.cedulaTemp && (
          <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.cedulaTemp}</p>
        )}

        {/* Resumen de precio */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px 20px",
            background: "rgba(249, 115, 22, 0.08)",
            border: "1px solid rgba(249, 115, 22, 0.2)",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-heading)" }}>
              {totalPersonas} persona{totalPersonas !== 1 ? "s" : ""} × ${PRECIO_PREVENTA.toFixed(2)} c/u
            </p>
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-accent)" }}>
              ${montoTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button className="btn-ghost" onClick={() => setPaso(1)} style={{ flex: 1 }} id="btn-volver-paso2">
            ← Volver
          </button>
          <button
            className="btn-primary"
            onClick={() => setPaso(3)}
            style={{ flex: 2 }}
            id="btn-siguiente-paso2"
          >
            Ir al pago →
          </button>
        </div>
      </div>
    );
  }

  // ── PASO 3: Comprobante ───────────────────────────────────
  function Paso3() {
    return (
      <div className="animar-aparecer">
        <h3 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px", color: "var(--color-text)" }}>
          Confirma tu pago
        </h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
          Transfiere <strong style={{ color: "var(--color-accent)" }}>${montoTotal.toFixed(2)}</strong> y sube el comprobante.
        </p>

        <SelectorCuenta montoTotal={montoTotal} />

        <div style={{ marginTop: "24px" }}>
          <SubirComprobante onComprobante={setComprobante} />
        </div>

        {errorGeneral && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "#DC2626",
              fontSize: "0.9rem",
            }}
          >
            {errorGeneral}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button className="btn-ghost" onClick={() => setPaso(2)} style={{ flex: 1 }} disabled={cargando} id="btn-volver-paso3">
            ← Volver
          </button>
          <button
            className="btn-cta"
            onClick={enviarOrden}
            style={{ flex: 2 }}
            disabled={cargando || !comprobante}
            id="btn-confirmar-orden"
          >
            {cargando ? (
              <>
                <span className="spinner" />
                Procesando...
              </>
            ) : (
              <>
                Confirmar orden →
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── PASO 4: Confirmación ──────────────────────────────────
  function Paso4() {
    return (
      <div className="animar-aparecer" style={{ textAlign: "center" }}>
        {/* Check animado */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(5, 150, 105, 0.10)",
            border: "2px solid var(--color-activo)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 16px rgba(5, 150, 105, 0.18)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} style={{ width: 40, height: 40 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)", marginBottom: "8px" }}>
          ¡Orden registrada!
        </h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
          Tu solicitud está en revisión. Cuando el staff la apruebe, recibirás tu ticket por WhatsApp.
        </p>

        <div
          style={{
            padding: "16px",
            background: "rgba(124, 58, 237, 0.05)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: "4px" }}>
            Tu número de referencia:
          </p>
          <p style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary-light)", fontSize: "0.85rem", wordBreak: "break-all" }}>
            {ticketUUID ?? "—"}
          </p>
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
          También puedes consultar el estado ingresando tu cédula en la sección de abajo.
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="card-glass" style={{ padding: "clamp(20px, 4vw, 40px)" }}>
      {IndicadorPasos()}
      {paso === 1 && Paso1()}
      {paso === 2 && Paso2()}
      {paso === 3 && Paso3()}
      {paso === 4 && Paso4()}
    </div>
  );
}
