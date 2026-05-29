"use client";

// ============================================================
// components/staff/ModalVentaRapida.tsx
// Venta en efectivo en la oficina
// Estado directo: Aprobado + tickets Activos
// ============================================================

import { useState } from "react";
import { validarCedula, validarTelefono } from "@/lib/validar-cedula";
import { PRECIO_PREVENTA, obtenerSesionActual } from "@/lib/insforge";
import { insforgeCliente } from "@/lib/insforge";
import { generarUrlWhatsApp } from "@/lib/whatsapp";

interface ModalVentaRapidaProps {
  onCerrar: () => void;
  onExito: () => void;
}

export default function ModalVentaRapida({ onCerrar, onExito }: ModalVentaRapidaProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedulaLider, setCedulaLider] = useState("");
  const [cedulas, setCedulas] = useState<string[]>([]);
  const [cedulaTemp, setCedulaTemp] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [exito, setExito] = useState<{ ticketUUID: string; nombre: string; telefono: string; cantidad: number } | null>(null);

  const totalPersonas = cedulas.includes(cedulaLider) ? cedulas.length : cedulas.length + 1;
  const montoTotal = totalPersonas * PRECIO_PREVENTA;

  function agregarCedula() {
    const cedula = cedulaTemp.trim();
    const res = validarCedula(cedula);
    if (!res.valida) { setErrores({ ...errores, cedulaTemp: res.error! }); return; }
    if (cedulas.includes(cedula) || cedula === cedulaLider) {
      setErrores({ ...errores, cedulaTemp: "Cédula ya en la lista." }); return;
    }
    if (totalPersonas >= 10) {
      setErrores({ ...errores, cedulaTemp: "Máximo 10 personas por grupo." }); return;
    }
    setCedulas([...cedulas, cedula]);
    setCedulaTemp("");
    setErrores({ ...errores, cedulaTemp: "" });
  }

  async function procesarVenta() {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim() || nombre.trim().length < 3) nuevosErrores.nombre = "Nombre requerido.";
    const resTel = validarTelefono(telefono);
    if (!resTel.valida) nuevosErrores.telefono = resTel.error!;
    const resCed = validarCedula(cedulaLider);
    if (!resCed.valida) nuevosErrores.cedulaLider = resCed.error!;

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    setErrorGeneral("");

    const todasLasCedulas = cedulas.includes(cedulaLider) ? cedulas : [cedulaLider, ...cedulas];

    try {
      // Obtener sesión del staff para el token
      const sesion = await obtenerSesionActual();
      if (!sesion) { setErrorGeneral("Sesión expirada."); return; }

      // Crear orden (venta rápida = sin comprobante, estado directo aprobado)
      const staffId = sesion.user.id;

      const { data: liderExistente } = await insforgeCliente.database
        .from("lideres")
        .select("id")
        .eq("cedula", cedulaLider)
        .single();

      let liderId: string;

      if (liderExistente) {
        liderId = liderExistente.id;
      } else {
        const { data: nuevoLider, error: errLider } = await insforgeCliente.database
          .from("lideres")
          .insert([{ nombre, telefono, cedula: cedulaLider }])
          .select("id")
          .single();

        if (errLider || !nuevoLider) {
          setErrorGeneral("Error al registrar el líder."); return;
        }
        liderId = nuevoLider.id;
      }

      // Crear orden directamente aprobada
      const { data: orden, error: errOrden } = await insforgeCliente.database
        .from("ordenes")
        .insert([{
          lider_id: liderId,
          estado: "aprobado",
          monto_total: montoTotal,
          aprobado_por: staffId,
        }])
        .select("id")
        .single();

      if (errOrden || !orden) {
        setErrorGeneral("Error al crear la orden."); return;
      }

      // Crear tickets directamente activos
      const { data: ticketsCreados, error: errTickets } = await insforgeCliente.database
        .from("tickets")
        .insert(
          todasLasCedulas.map((cedula) => ({
            orden_id: orden.id,
            cedula_asistente: cedula,
            estado: "activo",
            es_lider: cedula === cedulaLider,
          }))
        )
        .select("id, es_lider");

      if (errTickets || !ticketsCreados) {
        setErrorGeneral("Error al crear los tickets."); return;
      }

      // Registrar auditoría
      await insforgeCliente.database.from("auditoria").insert([{
        orden_id: orden.id,
        accion: "venta_rapida",
        staff_id: staffId,
        metadata: { nombre, cedula_lider: cedulaLider, cantidad: todasLasCedulas.length },
      }]);

      const ticketLider = ticketsCreados.find((t) => t.es_lider);
      setExito({ ticketUUID: ticketLider?.id ?? "", nombre, telefono, cantidad: todasLasCedulas.length });

    } catch (err) {
      console.error("Error venta rápida:", err);
      setErrorGeneral("Error inesperado. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  function abrirWhatsApp() {
    if (!exito) return;
    const url = generarUrlWhatsApp(exito.telefono, exito.nombre, exito.ticketUUID, exito.cantidad);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>Venta Rápida</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>Pago en efectivo — ticket activo inmediato</p>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Estado de éxito */}
        {exito ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid var(--color-activo)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} style={{ width: 32, height: 32 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4 style={{ fontFamily: "var(--font-heading)", marginBottom: "8px" }}>¡Venta registrada!</h4>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              {exito.nombre} · {exito.cantidad} persona{exito.cantidad !== 1 ? "s" : ""} · ${(exito.cantidad * PRECIO_PREVENTA).toFixed(2)}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-ghost" onClick={onExito} style={{ flex: 1 }} id="btn-cerrar-exito">Listo</button>
              <button className="btn-cta" onClick={abrirWhatsApp} style={{ flex: 2 }} id="btn-enviar-wa-venta">
                Enviar ticket por WhatsApp
                <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          // Formulario
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="vr-nombre">Nombre del comprador</label>
              <input id="vr-nombre" type="text" className={`input-field ${errores.nombre ? "error" : ""}`} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              {errores.nombre && <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.nombre}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="vr-telefono">Teléfono (WhatsApp)</label>
              <input id="vr-telefono" type="tel" inputMode="numeric" maxLength={10} className={`input-field ${errores.telefono ? "error" : ""}`} placeholder="0987654321" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} />
              {errores.telefono && <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.telefono}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="vr-cedula">Cédula del líder</label>
              <input id="vr-cedula" type="text" inputMode="numeric" maxLength={10} className={`input-field ${errores.cedulaLider ? "error" : ""}`} placeholder="0912345678" value={cedulaLider} onChange={(e) => setCedulaLider(e.target.value.replace(/\D/g, ""))} />
              {errores.cedulaLider && <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "4px" }}>{errores.cedulaLider}</p>}
            </div>

            {/* Acompañantes */}
            {cedulas.map((c) => (
              <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(139,92,246,0.05)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.88rem" }}>{c}</span>
                <button onClick={() => setCedulas(cedulas.filter((x) => x !== c))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}

            {totalPersonas < 10 && (
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" inputMode="numeric" maxLength={10} className="input-field" placeholder="Cédula acompañante" value={cedulaTemp} onChange={(e) => setCedulaTemp(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") agregarCedula(); }} style={{ flex: 1 }} id="vr-cedula-temp" />
                <button className="btn-ghost" onClick={agregarCedula} style={{ whiteSpace: "nowrap" }}>+ Agregar</button>
              </div>
            )}
            {errores.cedulaTemp && <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem" }}>{errores.cedulaTemp}</p>}

            {/* Resumen */}
            <div style={{ padding: "12px 16px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{totalPersonas} persona{totalPersonas !== 1 ? "s" : ""} × ${PRECIO_PREVENTA.toFixed(2)}</span>
              <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.3rem" }}>${montoTotal.toFixed(2)}</span>
            </div>

            {errorGeneral && (
              <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "0.85rem" }}>
                {errorGeneral}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn-ghost" onClick={onCerrar} style={{ flex: 1 }} disabled={enviando}>Cancelar</button>
              <button className="btn-cta" onClick={procesarVenta} disabled={enviando} style={{ flex: 2 }} id="btn-procesar-venta">
                {enviando ? <><span className="spinner" /> Procesando...</> : `Cobrar $${montoTotal.toFixed(2)} en efectivo`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
