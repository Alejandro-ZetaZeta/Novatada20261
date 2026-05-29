"use client";

// ============================================================
// components/public/SubirComprobante.tsx
// Estrategia anticaídas: imagen o texto de respaldo
// ============================================================
// Vía Multimedia (recomendada): Upload al bucket InsForge
// Vía Texto (respaldo): Fecha + Referencia + Cuenta origen
// ============================================================

import { useState, useCallback } from "react";

interface DatosComprobante {
  tipo: "imagen" | "texto";
  comprobante_url?: string;
  comprobante_key?: string;
  fecha_transferencia?: string;
  num_referencia?: string;
  cuenta_origen?: string;
}

interface SubirComprobanteProps {
  onComprobante: (datos: DatosComprobante) => void;
}

export default function SubirComprobante({ onComprobante }: SubirComprobanteProps) {
  const [modo, setModo] = useState<"imagen" | "texto">("imagen");
  const [subiendo, setSubiendo] = useState(false);
  const [imagenSubida, setImagenSubida] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");

  // Datos modo texto
  const [fechaTransferencia, setFechaTransferencia] = useState("");
  const [numReferencia, setNumReferencia] = useState("");
  const [cuentaOrigen, setCuentaOrigen] = useState("");

  // ── Upload de imagen ──────────────────────────────────────
  const manejarArchivo = useCallback(async (archivo: File) => {
    if (!archivo) return;

    const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!TIPOS.includes(archivo.type)) {
      setError("Solo se permiten imágenes (JPG, PNG, WEBP, HEIC).");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("El archivo no debe superar 5MB.");
      return;
    }

    setError("");
    setSubiendo(true);
    setNombreArchivo(archivo.name);

    try {
      // Subir directamente al servidor (que lo envía al bucket InsForge)
      const formData = new FormData();
      formData.append("archivo", archivo);

      const res = await fetch("/api/storage/upload-url", {
        method: "POST",
        body: formData,
      });

      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.error ?? "No se pudo subir el archivo.");
      }

      setImagenSubida(true);
      onComprobante({
        tipo: "imagen",
        comprobante_url: datos.url,
        comprobante_key: datos.key,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el comprobante.");
      setImagenSubida(false);
    } finally {
      setSubiendo(false);
    }
  }, [onComprobante]);

  // ── Actualizar datos modo texto ───────────────────────────
  function actualizarTexto(campo: string, valor: string) {
    const nuevoFecha = campo === "fecha" ? valor : fechaTransferencia;
    const nuevoRef = campo === "ref" ? valor : numReferencia;
    const nuevoCuenta = campo === "cuenta" ? valor : cuentaOrigen;

    if (campo === "fecha") setFechaTransferencia(valor);
    if (campo === "ref") setNumReferencia(valor);
    if (campo === "cuenta") setCuentaOrigen(valor);

    if (nuevoFecha && nuevoRef && nuevoCuenta) {
      onComprobante({
        tipo: "texto",
        fecha_transferencia: nuevoFecha,
        num_referencia: nuevoRef,
        cuenta_origen: nuevoCuenta,
      });
    }
  }

  return (
    <div>
      {/* Toggle modo */}
      <div
        style={{
          display: "flex",
          background: "rgba(139, 92, 246, 0.05)",
          borderRadius: "10px",
          border: "1px solid var(--color-border)",
          padding: "3px",
          marginBottom: "16px",
        }}
      >
        <button
          id="btn-modo-imagen"
          onClick={() => setModo("imagen")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontSize: "0.8rem",
            fontWeight: 600,
            background: modo === "imagen" ? "var(--color-primary)" : "transparent",
            color: modo === "imagen" ? "white" : "var(--color-text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          📷 Subir captura
        </button>
        <button
          id="btn-modo-texto"
          onClick={() => setModo("texto")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontSize: "0.8rem",
            fontWeight: 600,
            background: modo === "texto" ? "var(--color-primary)" : "transparent",
            color: modo === "texto" ? "white" : "var(--color-text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          ✍️ Sin señal
        </button>
      </div>

      {/* Modo imagen */}
      {modo === "imagen" && (
        <div className="animar-aparecer">
          <label
            htmlFor="input-comprobante"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              border: `2px dashed ${imagenSubida ? "var(--color-activo)" : "var(--color-border)"}`,
              borderRadius: "12px",
              cursor: "pointer",
              background: imagenSubida
                ? "rgba(16, 185, 129, 0.05)"
                : "rgba(139, 92, 246, 0.03)",
              transition: "all 0.2s ease",
              gap: "8px",
            }}
          >
            {subiendo ? (
              <>
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Subiendo...</span>
              </>
            ) : imagenSubida ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2} style={{ width: 36, height: 36 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: "var(--color-activo)", fontWeight: 600, fontSize: "0.9rem" }}>Comprobante subido</span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{nombreArchivo}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 36, height: 36, color: "var(--color-text-muted)" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>Toca aquí para subir</span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Sube tu comprobante de pago(JPG, PNG, WEBP — máx. 5MB)</span>
              </>
            )}
          </label>
          <input
            id="input-comprobante"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            style={{ display: "none" }}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) manejarArchivo(archivo);
            }}
          />
        </div>
      )}

      {/* Modo texto (respaldo señal débil) */}
      {modo === "texto" && (
        <div className="animar-aparecer" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "#FCD34D",
            }}
          >
            Usa esta opción solo si tienes mala señal y no puedes subir la imagen.
          </div>

          <div>
            <label className="input-label" htmlFor="input-fecha-transferencia">Fecha de transferencia</label>
            <input
              id="input-fecha-transferencia"
              type="date"
              className="input-field"
              value={fechaTransferencia}
              onChange={(e) => actualizarTexto("fecha", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="input-num-referencia">Número de comprobante / referencia</label>
            <input
              id="input-num-referencia"
              type="text"
              inputMode="numeric"
              className="input-field"
              placeholder="Ej: 012345678901"
              value={numReferencia}
              onChange={(e) => actualizarTexto("ref", e.target.value)}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="input-cuenta-origen">Cuenta bancaria de origen</label>
            <input
              id="input-cuenta-origen"
              type="text"
              inputMode="numeric"
              className="input-field"
              placeholder="Número de cuenta desde donde transferiste"
              value={cuentaOrigen}
              onChange={(e) => actualizarTexto("cuenta", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: "var(--color-anulado)", fontSize: "0.8rem", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}
