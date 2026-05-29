// ============================================================
// app/staff/panel/page.tsx — Panel Principal del Staff
// Lista de órdenes + Venta Rápida
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { insforgeCliente, obtenerSesionActual } from "@/lib/insforge";
import type { Orden } from "@/lib/insforge";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import ModalVentaRapida from "@/components/staff/ModalVentaRapida";
import ModalDetalle from "@/components/staff/ModalDetalle";
import GestionStaff from "@/components/staff/GestionStaff";
import ResumenCaja from "@/components/staff/ResumenCaja";

type FiltroEstado = "todos" | "pendiente" | "aprobado" | "anulado";
type Vista = "ordenes" | "staff" | "caja";

export default function PanelStaff() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filtro, setFiltro] = useState<FiltroEstado>("pendiente");
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<{ id: string; email: string } | null>(null);
  const [modalVenta, setModalVenta] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState<"staff" | "admin" | null>(null);
  const [vista, setVista] = useState<Vista>("ordenes");
  const [contadoresGlobales, setContadoresGlobales] = useState({ pendiente: 0, aprobado: 0, anulado: 0 });

  // Verificar sesión con reintentos (WebViews móviles inicializan storage tarde)
  useEffect(() => {
    let cancelado = false;

    async function verificarSesion() {
      // 1. localStorage token (written at login, survives hard reload)
      const tokenLS = localStorage.getItem("staff_access_token");
      if (tokenLS) {
        try {
          const payload = JSON.parse(atob(tokenLS.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          const userId = payload.sub as string;
          const userEmail = (payload.email ?? "") as string;
          if (userId) {
            // Restore token into SDK so RLS-gated DB queries work
            insforgeCliente.setAccessToken(tokenLS);
            setSesion({ id: userId, email: userEmail });
            const { data: staffData } = await insforgeCliente.database
              .from("staff")
              .select("rol")
              .eq("id", userId)
              .single();
            if (!cancelado && staffData) setRol((staffData as { rol: string }).rol as "staff" | "admin");
            return;
          }
        } catch {
          localStorage.removeItem("staff_access_token");
        }
      }

      // 2. Network fallback (SPA nav: token still in SDK memory)
      const MAX_INTENTOS = 4;
      const DELAY_MS = 700;

      for (let intento = 0; intento < MAX_INTENTOS; intento++) {
        const sesionActual = await obtenerSesionActual();
        if (cancelado) return;

        if (sesionActual) {
          setSesion({ id: sesionActual.user.id, email: sesionActual.user.email });

          const { data: staffData } = await insforgeCliente.database
            .from("staff")
            .select("rol")
            .eq("id", sesionActual.user.id)
            .single();
          if (!cancelado && staffData) setRol((staffData as { rol: string }).rol as "staff" | "admin");
          return;
        }

        if (intento === MAX_INTENTOS - 1) {
          router.push("/staff/login");
          return;
        }

        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    verificarSesion();
    return () => { cancelado = true; };
  }, [router]);

  // ── Cargar órdenes ────────────────────────────────────────
  const cargarOrdenes = useCallback(async () => {
    setCargando(true);
    try {
      let query = insforgeCliente
        .database.from("ordenes")
        .select(`
          id, estado, monto_total, created_at, updated_at,
          comprobante_url, comprobante_key, num_referencia,
          fecha_transferencia, cuenta_origen,
          lideres (id, nombre, telefono, cedula)
        `)
        .order("created_at", { ascending: false });

      if (filtro !== "todos") {
        query = query.eq("estado", filtro);
      }

      const { data, error } = await query;

      if (error) {
        const e = error as { message?: string; statusCode?: number; error?: string };
        console.error("Error cargando órdenes — message:", e.message, "| status:", e.statusCode, "| error:", e.error, "| raw:", String(error));
        return;
      }

      setOrdenes((data as unknown as Orden[]) ?? []);
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  // ── Cargar contadores globales (siempre sin filtro) ───────
  const cargarContadores = useCallback(async () => {
    const { data } = await insforgeCliente.database
      .from("ordenes")
      .select("estado");
    if (!data) return;
    const filas = data as { estado: string }[];
    setContadoresGlobales({
      pendiente: filas.filter((o) => o.estado === "pendiente").length,
      aprobado:  filas.filter((o) => o.estado === "aprobado").length,
      anulado:   filas.filter((o) => o.estado === "anulado").length,
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sesion) { cargarOrdenes(); cargarContadores(); }
  }, [sesion, filtro, cargarOrdenes, cargarContadores]);

  // ── Cerrar sesión ─────────────────────────────────────────
  async function cerrarSesion() {
    sessionStorage.removeItem("staff_access_token");
    localStorage.removeItem("staff_access_token");
    await insforgeCliente.auth.signOut();
    router.push("/staff/login");
  }

  // ── Filtrar por búsqueda ──────────────────────────────────
  const ordenesFiltradas = ordenes.filter((orden) => {
    if (!busqueda) return true;
    const b = busqueda.toLowerCase();
    const lider = orden.lideres;
    return (
      lider?.nombre?.toLowerCase().includes(b) ||
      lider?.cedula?.includes(b) ||
      lider?.telefono?.includes(b) ||
      orden.id.toLowerCase().includes(b)
    );
  });

  function formatearFecha(fechaISO: string): string {
    return new Date(fechaISO).toLocaleString("es-EC", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ── Contadores (globales, independientes del filtro) ─────
  const contadores = contadoresGlobales;

  if (!sesion) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Header staff */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(250, 245, 255, 0.95)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Panel Staff</h1>
          {rol === "admin" && (
            <span style={{
              fontSize: "0.65rem",
              background: "var(--color-primary)",
              color: "white",
              padding: "2px 8px",
              borderRadius: "100px",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}>
              ADMIN
            </span>
          )}
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Novatada ULEAM 2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {rol === "admin" && (
            <>
              <button
                className={vista === "staff" ? "btn-primary" : "btn-ghost"}
                onClick={() => setVista(vista === "staff" ? "ordenes" : "staff")}
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                id="btn-vista-staff"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Gestión Staff
              </button>
              <button
                className={vista === "caja" ? "btn-primary" : "btn-ghost"}
                onClick={() => setVista(vista === "caja" ? "ordenes" : "caja")}
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                id="btn-vista-caja"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Caja
              </button>
            </>
          )}
          {vista === "ordenes" && (
            <>
              <a
                href="/staff/panel/scanner"
                className="btn-ghost"
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                id="link-scanner"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <rect x="2" y="2" width="20" height="20" rx="4" />
                  <path d="M7 12h10M12 7v10" />
                </svg>
                Scanner QR
              </a>
              <button
                className="btn-cta"
                onClick={() => setModalVenta(true)}
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                id="btn-venta-rapida"
              >
                + Venta Rápida
              </button>
            </>
          )}
          <button
            className="btn-ghost"
            onClick={cerrarSesion}
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
            id="btn-cerrar-sesion"
          >
            Salir
          </button>
        </div>
      </header>

      {vista === "staff" ? (
        <GestionStaff />
      ) : vista === "caja" ? (
        <ResumenCaja />
      ) : (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        {/* Stats rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Pendientes", valor: contadores.pendiente, estado: "pendiente" as FiltroEstado, color: "var(--color-pendiente)" },
            { label: "Aprobadas", valor: contadores.aprobado, estado: "aprobado" as FiltroEstado, color: "var(--color-activo)" },
            { label: "Anuladas", valor: contadores.anulado, estado: "anulado" as FiltroEstado, color: "var(--color-anulado)" },
          ].map((stat) => (
            <button
              key={stat.estado}
              onClick={() => setFiltro(stat.estado)}
              style={{
                padding: "16px",
                background: filtro === stat.estado
                  ? `rgba(${stat.estado === "pendiente" ? "245,158,11" : stat.estado === "aprobado" ? "16,185,129" : "239,68,68"}, 0.1)`
                  : "rgba(255, 255, 255, 0.7)",
                border: `1px solid ${filtro === stat.estado ? stat.color : "var(--color-border)"}`,
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
              id={`btn-filtro-${stat.estado}`}
            >
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", margin: "0 0 4px" }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.8rem", margin: 0 }}>
                {stat.valor}
              </p>
            </button>
          ))}
        </div>

        {/* Barra de búsqueda y filtros */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            id="input-busqueda-ordenes"
            style={{ flex: 1, minWidth: "200px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            {(["todos", "pendiente", "aprobado", "anulado"] as FiltroEstado[]).map((f) => (
              <button
                key={f}
                className={filtro === f ? "btn-primary" : "btn-ghost"}
                onClick={() => setFiltro(f)}
                style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                id={`btn-tab-${f}`}
              >
                {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de órdenes */}
        {cargando ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div
            className="card-glass"
            style={{ padding: "48px", textAlign: "center" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1} style={{ width: 48, height: 48, margin: "0 auto 16px" }}>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
            <p style={{ color: "var(--color-text-muted)" }}>No hay órdenes en este estado.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ordenesFiltradas.map((orden) => (
              <div
                key={orden.id}
                className="card-glass"
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
                onClick={() => setOrdenSeleccionada(orden)}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)", margin: 0, fontSize: "0.95rem" }}>
                      {orden.lideres?.nombre ?? "—"}
                    </p>
                    <Badge estado={orden.estado} />
                  </div>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", margin: 0 }}>
                    Cédula: {orden.lideres?.cedula ?? "—"} · Tel: {orden.lideres?.telefono ?? "—"}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
                      ${Number(orden.monto_total).toFixed(2)}
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", margin: 0 }}>
                      {formatearFecha(orden.created_at)}
                    </p>
                  </div>

                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={2} style={{ width: 16, height: 16 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Modales */}
      {modalVenta && (
        <ModalVentaRapida
          onCerrar={() => setModalVenta(false)}
          onExito={() => { setModalVenta(false); cargarOrdenes(); cargarContadores(); }}
        />
      )}

      {ordenSeleccionada && (
        <ModalDetalle
          orden={ordenSeleccionada}
          rol={rol ?? "staff"}
          onCerrar={() => setOrdenSeleccionada(null)}
          onAprobada={() => { setOrdenSeleccionada(null); cargarOrdenes(); cargarContadores(); }}
        />
      )}
    </main>
  );
}
