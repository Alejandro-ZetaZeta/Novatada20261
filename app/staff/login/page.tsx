// ============================================================
// app/staff/login/page.tsx — Login de Staff
// ============================================================

"use client";

import { useState } from "react";
import { insforgeCliente } from "@/lib/insforge";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaginaLoginStaff() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const { data: dataSesion, error: errAuth } = await insforgeCliente.auth.signInWithPassword({
        email,
        password,
      });

      if (errAuth) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
        return;
      }

      // Persist token so scanner page survives hard reload on mobile
      // SDK is memory-only; hard reload wipes session, so we store it ourselves
      const token = (dataSesion as unknown as { accessToken?: string })?.accessToken;
      if (token) {
        localStorage.setItem("staff_access_token", token);
      }

      router.push("/staff/panel");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-neon))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 28, height: 28 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Panel de Staff</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Asociación de Estudiantes Uleam Chone
          </p>
        </div>

        <form className="card-glass" style={{ padding: "32px" }} onSubmit={iniciarSesion}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label className="input-label" htmlFor="email-staff">Email</label>
              <input
                id="email-staff"
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="input-label" htmlFor="password-staff">Contraseña</label>
              <input
                id="password-staff"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(220, 38, 38, 0.07)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: "8px",
                  color: "#DC2626",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={cargando}
              id="btn-login-staff"
            >
              {cargando ? (
                <>
                  <span className="spinner" />
                  Iniciando sesión...
                </>
              ) : "Ingresar al panel"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          <Link href="/" style={{ color: "var(--color-primary-light)", textDecoration: "none" }}>← Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
