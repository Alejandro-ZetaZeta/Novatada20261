"use client";

// ============================================================
// app/staff/panel/scanner/page.tsx — Scanner QR en Puerta
// ============================================================
// Usa jsQR para leer el código QR desde la cámara.
// Al escanear → POST /api/tickets/[uuid]/validar (con auth)
// Solo funciona con sesión activa de staff.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { insforgeCliente, obtenerSesionActual } from "@/lib/insforge";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";

// Clave de sessionStorage para el token de sesión del staff
const SESSION_KEY = "staff_access_token";

interface DatosValidacion {
  ok: boolean;
  mensaje: string;
  cantidad: number;
}

interface DatosTicket {
  uuid: string;
  nombre_lider: string;
  cantidad_personas: number;
  estado: string;
  asistentes: Array<{ cedula_masked: string; es_lider: boolean; estado: string }>;
}

export default function PaginaScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  // jsQR se importa una sola vez y se guarda aquí
  const jsqrRef = useRef<((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null>(null);
  const ultimoFrameRef = useRef<number>(0);
  const [escaneando, setEscaneando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [sesion, setSesion] = useState<{ token: string } | null>(null);
  const [ticketData, setTicketData] = useState<DatosTicket | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<DatosValidacion | null>(null);
  const [error, setError] = useState("");
  const [busquedaCedula, setBusquedaCedula] = useState("");

  // Verificar sesión con reintentos + respaldo en sessionStorage
  // (WebViews móviles como WhatsApp inicializan storage de forma asíncrona)
  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      // 1. Intentar restaurar desde sessionStorage (sobrevive suspensión del WebView)
      const tokenGuardado = sessionStorage.getItem(SESSION_KEY);
      if (tokenGuardado) {
        setSesion({ token: tokenGuardado });
        // Pre-cargar jsQR mientras la cámara no está activa
        import("jsqr").then(({ default: fn }) => { jsqrRef.current = fn; });
        return;
      }

      // 2. Si no hay token guardado, intentar obtener sesión de InsForge
      const MAX_INTENTOS = 5;
      const DELAY_MS = 600;

      for (let intento = 0; intento < MAX_INTENTOS; intento++) {
        const sesionActual = await obtenerSesionActual();
        if (cancelado) return;

        if (sesionActual) {
          // Guardar en sessionStorage para sobrevivir reinicios del WebView
          sessionStorage.setItem(SESSION_KEY, sesionActual.accessToken);
          setSesion({ token: sesionActual.accessToken });
          // Pre-cargar jsQR
          import("jsqr").then(({ default: fn }) => { jsqrRef.current = fn; });
          return;
        }

        if (intento === MAX_INTENTOS - 1) {
          sessionStorage.removeItem(SESSION_KEY);
          router.push("/staff/login");
          return;
        }

        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    verificar();
    return () => { cancelado = true; };
  }, [router]);

  // ── Iniciar cámara ────────────────────────────────────────
  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setEscaneando(true);
        escanearFrame();
      }
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  }

  function detenerCamara() {
    cancelAnimationFrame(animRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setEscaneando(false);
  }

  // ── Escanear frames (jsQR cargado una sola vez, throttle a 200ms) ────
  const procesarQR = useCallback(async (uuid: string) => {
    if (!sesion || cargando) return;
    detenerCamara();
    setCargando(true);
    setError("");

    try {
      const resTicket = await fetch(`/api/tickets/${uuid}`);
      if (resTicket.ok) {
        const datos = await resTicket.json();
        setTicketData({ ...datos, uuid });
      }
    } catch {
      setError("Error al obtener datos del ticket.");
    } finally {
      setCargando(false);
    }
  }, [sesion, cargando]);

  function escanearFrame() {
    if (!videoRef.current || !canvasRef.current) return;

    // Throttle: procesar solo 5 frames por segundo para no saturar el móvil
    const ahora = performance.now();
    if (ahora - ultimoFrameRef.current < 200) {
      animRef.current = requestAnimationFrame(escanearFrame);
      return;
    }
    ultimoFrameRef.current = ahora;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== 4) {
      animRef.current = requestAnimationFrame(escanearFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // jsQR ya está cargado en jsqrRef (importado al verificar sesión)
    const jsQR = jsqrRef.current;
    if (!jsQR) {
      // Todavía cargando — reintentar en el siguiente frame
      animRef.current = requestAnimationFrame(escanearFrame);
      return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code?.data) {
      const match = code.data.match(/\/api\/tickets\/([a-f0-9-]{36})\/validar/);
      if (match) {
        procesarQR(match[1]);
        return;
      }
    }

    animRef.current = requestAnimationFrame(escanearFrame);
  }

  // ── Confirmar ingreso ─────────────────────────────────────
  async function confirmarIngreso() {
    if (!ticketData || !sesion) return;
    setCargando(true);

    try {
      const res = await fetch(`/api/tickets/${ticketData.uuid}/validar`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${sesion.token}` },
      });

      const datos = await res.json();

      if (res.ok) {
        setResultadoValidacion(datos);
      } else {
        setError(datos.error ?? "Error al validar.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setCargando(false);
    }
  }

  // ── Búsqueda por cédula ───────────────────────────────────
  async function buscarPorCedula() {
    if (!busquedaCedula.trim()) return;
    setCargando(true);
    setError("");

    try {
      const res = await fetch(`/api/tickets/estado?cedula=${busquedaCedula.trim()}`);
      const datos = await res.json();

      if (!res.ok || !datos.encontrado) {
        setError("No se encontró ningún ticket activo para esa cédula.");
        return;
      }

      // Si hay un ticket activo con UUID (líder), mostrarlo
      // Nota: la API pública no expone UUIDs; esta es una ruta interna de staff
      setError("Búsqueda por cédula disponible en el panel principal.");
    } catch {
      setError("Error de red.");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setTicketData(null);
    setResultadoValidacion(null);
    setError("");
    setBusquedaCedula("");
  }

  return (
    <main style={{ minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <a
            href="/staff/panel"
            style={{ color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Panel
          </a>
          <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Control de Puerta</h1>
        </div>

        {/* Si hay resultado de validación */}
        {resultadoValidacion ? (
          <div className="card-glass animar-aparecer" style={{ padding: "32px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid var(--color-activo)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 30px rgba(16,185,129,0.4)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} style={{ width: 36, height: 36 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px", color: "var(--color-activo)" }}>¡Ingreso Confirmado!</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
              {resultadoValidacion.cantidad} persona{resultadoValidacion.cantidad !== 1 ? "s" : ""} marcadas como ingresadas.
            </p>
            <button className="btn-primary" onClick={reiniciar} style={{ width: "100%" }} id="btn-nuevo-escaneo">
              Escanear siguiente grupo
            </button>
          </div>
        ) : ticketData ? (
          // Modal de confirmación
          <div className="card-glass animar-aparecer" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-heading)", margin: 0 }}>{ticketData.nombre_lider}</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                  Grupo de {ticketData.cantidad_personas} persona{ticketData.cantidad_personas !== 1 ? "s" : ""}
                </p>
              </div>
              <Badge estado={ticketData.estado} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              {ticketData.asistentes.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(139,92,246,0.05)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.88rem", letterSpacing: "0.04em" }}>{a.cedula_masked}</span>
                    {a.es_lider && <span style={{ fontSize: "0.6rem", background: "var(--color-primary)", color: "white", padding: "1px 6px", borderRadius: "100px", fontFamily: "var(--font-heading)", fontWeight: 600 }}>LÍDER</span>}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "0.85rem", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-ghost" onClick={reiniciar} style={{ flex: 1 }} disabled={cargando}>Cancelar</button>
              <button
                className="btn-cta"
                onClick={confirmarIngreso}
                disabled={cargando || ticketData.estado !== "activo"}
                style={{ flex: 2 }}
                id="btn-confirmar-ingreso"
              >
                {cargando ? <><span className="spinner" /> Validando...</> : "✓ Confirmar Ingreso Total"}
              </button>
            </div>
          </div>
        ) : (
          // Vista del scanner
          <>
            {/* Vista de cámara */}
            <div className="card-glass" style={{ padding: "0", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{ position: "relative", aspectRatio: "4/3", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Marco de escaneo */}
                {escaneando && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ width: "200px", height: "200px", position: "relative" }}>
                      {["topleft", "topright", "bottomleft", "bottomright"].map((pos) => (
                        <div key={pos} style={{
                          position: "absolute",
                          width: "40px",
                          height: "40px",
                          borderColor: "var(--color-neon)",
                          borderStyle: "solid",
                          borderWidth: pos.includes("top") ? "3px 0 0 3px" : pos.includes("left") ? "0 0 3px 3px" : "0 3px 3px 0",
                          ...(pos === "topright" && { right: 0, top: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: "3px", borderTopWidth: "3px" }),
                          ...(pos === "bottomleft" && { left: 0, bottom: 0, borderRightWidth: 0, borderTopWidth: 0 }),
                          ...(pos === "bottomright" && { right: 0, bottom: 0, borderLeftWidth: 0, borderTopWidth: 0 }),
                          boxShadow: "0 0 8px rgba(192,132,252,0.5)",
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {!escaneando && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1} style={{ width: 56, height: 56 }}>
                      <rect x="2" y="2" width="20" height="20" rx="4" /><path d="M7 12h10M12 7v10" />
                    </svg>
                    <p style={{ color: "var(--color-text-muted)", textAlign: "center", fontSize: "0.9rem" }}>Toca para iniciar la cámara</p>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px", display: "flex", gap: "10px" }}>
                {!escaneando ? (
                  <button className="btn-primary" onClick={iniciarCamara} style={{ flex: 1 }} id="btn-iniciar-camara">
                    Iniciar cámara
                  </button>
                ) : (
                  <button className="btn-ghost" onClick={detenerCamara} style={{ flex: 1 }} id="btn-detener-camara">
                    Detener
                  </button>
                )}
              </div>
            </div>

            {/* Búsqueda por cédula */}
            <div className="card-glass" style={{ padding: "16px" }}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                O buscar por cédula del líder
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  className="input-field"
                  placeholder="Cédula del líder del grupo"
                  value={busquedaCedula}
                  onChange={(e) => setBusquedaCedula(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") buscarPorCedula(); }}
                  style={{ flex: 1 }}
                  id="input-buscar-cedula-scanner"
                />
                <button className="btn-ghost" onClick={buscarPorCedula} disabled={cargando || busquedaCedula.length !== 10} id="btn-buscar-cedula">
                  Buscar
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
