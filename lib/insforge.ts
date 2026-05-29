// ============================================================
// lib/insforge.ts — Cliente InsForge Singleton
// Novatada ULEAM 2026
// ============================================================
// API correcta del @insforge/sdk v1.2.x:
//   - createClient({ baseUrl, anonKey }) → InsForgeClient
//   - client.database.from("tabla").select/insert/update/delete
//   - client.auth.getUser() / signIn / signOut
//   - client.storage.from("bucket").upload / createSignedUrl
//   - client.setAccessToken(token) para elevar permisos
// ============================================================

import { createClient } from "@insforge/sdk";

/** URL base del proyecto InsForge */
const INSFORGE_BASE_URL =
  process.env.INSFORGE_URL ?? "https://ztcuv77y.us-west.insforge.app";

/** Clave ANON pública (safe para el browser) */
const INSFORGE_ANON_KEY =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";

/** Clave de Servicio (SOLO server-side) */
const INSFORGE_SERVICE_KEY =
  process.env.INSFORGE_SERVICE_KEY ?? "";

// ────────────────────────────────────────────────────────────
// Cliente para el navegador / componentes de cliente
// Respeta las políticas RLS
// ────────────────────────────────────────────────────────────
export const insforgeCliente = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

// ────────────────────────────────────────────────────────────
// Cliente para API routes (server-side únicamente)
// Usa la service key para operaciones elevadas
// ────────────────────────────────────────────────────────────
export const insforgeServidor = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_SERVICE_KEY || INSFORGE_ANON_KEY,
});

// ────────────────────────────────────────────────────────────
// Acceso a la base de datos (shorthand)
// Uso: db.from("tabla").select(...) etc.
// ────────────────────────────────────────────────────────────
export const db = insforgeCliente.database;
export const dbAdmin = insforgeServidor.database;

// ────────────────────────────────────────────────────────────
// Crear cliente con token de usuario (para API routes de staff)
// ────────────────────────────────────────────────────────────
export function createClientWithToken(accessToken: string) {
  const cliente = createClient({
    baseUrl: INSFORGE_BASE_URL,
    anonKey: INSFORGE_ANON_KEY,
  });
  cliente.setAccessToken(accessToken);
  return cliente;
}

// ────────────────────────────────────────────────────────────
// Decodificar JWT para obtener el sub (user ID)
// Para verificación de token en API routes sin roundtrip
// ────────────────────────────────────────────────────────────
export function decodeJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// Obtener sesión actual (async) — envuelve getCurrentUser del SDK
// Uso en Client Components en lugar de getSession()
// Devuelve { user, accessToken } o null si no hay sesión
// ────────────────────────────────────────────────────────────
export async function obtenerSesionActual(): Promise<{ user: { id: string; email: string }; accessToken: string } | null> {
  try {
    const { data, error } = await insforgeCliente.auth.getCurrentUser();
    if (error || !data.user) return null;

    // Obtener el access token del token manager interno (via getHttpClient)
    const httpClient = insforgeCliente.getHttpClient();
    // El token está en la Authorization header que usará el cliente
    // Alternativamente, guardamos el token en login y lo recuperamos
    const token = (httpClient as unknown as { tokenManager?: { getAccessToken(): string | null } })
      ?.tokenManager?.getAccessToken() ?? "";

    return {
      user: { id: data.user.id, email: data.user.email ?? "" },
      accessToken: token,
    };
  } catch {
    return null;
  }
}


// ────────────────────────────────────────────────────────────
// Tipos derivados del esquema de la base de datos
// ────────────────────────────────────────────────────────────

export type EstadoOrden = "pendiente" | "aprobado" | "anulado";
export type EstadoTicket = "pendiente" | "activo" | "usado";
export type RolStaff = "staff" | "admin";

export interface Lider {
  id: string;
  nombre: string;
  /** Teléfono: 10 dígitos TEXT (inicia en 0) */
  telefono: string;
  /** Cédula: 10 dígitos TEXT (puede iniciar en 0) */
  cedula: string;
  created_at: string;
}

export interface Orden {
  id: string;
  lider_id: string;
  estado: EstadoOrden;
  monto_total: number;
  comprobante_url: string | null;
  comprobante_key: string | null;
  fecha_transferencia: string | null;
  num_referencia: string | null;
  cuenta_origen: string | null;
  aprobado_por: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones (join)
  lideres?: Lider;
}

export interface Ticket {
  id: string;
  orden_id: string;
  /** Cédula: TEXT para preservar cero inicial */
  cedula_asistente: string;
  estado: EstadoTicket;
  es_lider: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones (join)
  ordenes?: Orden;
}

export interface Staff {
  id: string;
  nombre: string;
  email: string;
  rol: RolStaff;
  activo: boolean;
  created_at: string;
}

export interface Auditoria {
  id: string;
  orden_id: string | null;
  ticket_id: string | null;
  accion: string;
  staff_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Constantes de negocio
// ────────────────────────────────────────────────────────────
export const PRECIO_PREVENTA = 3.0; // USD por persona
export const FECHA_EVENTO = new Date("2026-07-31T20:00:00-05:00"); // Ecuador (UTC-5)

/** Nombre del bucket privado para comprobantes */
export const BUCKET_COMPROBANTES = "comprobantes";
