"use client";

// ============================================================
// components/staff/GestionStaff.tsx
// Vista de gestión de staff — solo visible para rol admin
// ============================================================

import { useState, useEffect } from "react";
import { insforgeCliente } from "@/lib/insforge";
import type { Staff } from "@/lib/insforge";

export default function GestionStaff() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function cargarStaff() {
    setCargando(true);
    const { data } = await insforgeCliente.database
      .from("staff")
      .select("*")
      .order("created_at", { ascending: true });
    setStaffList((data as Staff[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargarStaff(); }, []);

  async function toggleActivo(miembro: Staff) {
    setActualizando(miembro.id);
    const { error } = await insforgeCliente.database
      .from("staff")
      .update({ activo: !miembro.activo })
      .eq("id", miembro.id);
    if (!error) {
      setStaffList((prev) =>
        prev.map((s) => s.id === miembro.id ? { ...s, activo: !s.activo } : s)
      );
    }
    setActualizando(null);
  }

  async function cambiarRol(miembro: Staff) {
    const nuevoRol = miembro.rol === "staff" ? "admin" : "staff";
    if (!confirm(`¿Cambiar rol de "${miembro.nombre}" a "${nuevoRol}"?`)) return;
    setActualizando(miembro.id);
    const { error } = await insforgeCliente.database
      .from("staff")
      .update({ rol: nuevoRol })
      .eq("id", miembro.id);
    if (!error) {
      setStaffList((prev) =>
        prev.map((s) => s.id === miembro.id ? { ...s, rol: nuevoRol as "staff" | "admin" } : s)
      );
    }
    setActualizando(null);
  }

  function formatearFecha(fechaISO: string): string {
    return new Date(fechaISO).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-text)" }}>
          Gestión de Staff
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
          Activa, desactiva o cambia el rol de los miembros. Para agregar nuevo staff, crea primero el usuario en el dashboard de InsForge y luego inserta su UUID en la tabla <code>staff</code>.
        </p>
      </div>

      {cargando ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : staffList.length === 0 ? (
        <div className="card-glass" style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)" }}>No hay miembros de staff registrados.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {staffList.map((miembro) => (
            <div
              key={miembro.id}
              className="card-glass"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                opacity: miembro.activo ? 1 : 0.55,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)", margin: 0, fontSize: "0.95rem" }}>
                    {miembro.nombre}
                  </p>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      background: miembro.rol === "admin" ? "var(--color-primary)" : "rgba(124, 58, 237, 0.1)",
                      color: miembro.rol === "admin" ? "white" : "var(--color-primary)",
                      border: miembro.rol === "admin" ? "none" : "1px solid var(--color-border)",
                      padding: "2px 8px",
                      borderRadius: "100px",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 600,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {miembro.rol}
                  </span>
                  {!miembro.activo && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "rgba(107, 114, 128, 0.1)",
                        color: "#374151",
                        border: "1px solid rgba(107, 114, 128, 0.2)",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                      }}
                    >
                      INACTIVO
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", margin: 0 }}>
                  {miembro.email} · Desde {formatearFecha(miembro.created_at)}
                </p>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button
                  className="btn-ghost"
                  onClick={() => cambiarRol(miembro)}
                  disabled={actualizando === miembro.id}
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                  title={`Cambiar a ${miembro.rol === "staff" ? "admin" : "staff"}`}
                >
                  {actualizando === miembro.id ? (
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  ) : (
                    miembro.rol === "staff" ? "→ Admin" : "→ Staff"
                  )}
                </button>
                <button
                  className={miembro.activo ? "btn-danger" : "btn-ghost"}
                  onClick={() => toggleActivo(miembro)}
                  disabled={actualizando === miembro.id}
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  {actualizando === miembro.id ? (
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  ) : miembro.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "16px" }}>
        {staffList.length} miembro{staffList.length !== 1 ? "s" : ""} registrado{staffList.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
