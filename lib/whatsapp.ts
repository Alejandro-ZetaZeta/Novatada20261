// ============================================================
// lib/whatsapp.ts — Generador de URLs para WhatsApp
// Novatada ULEAM 2026
// ============================================================
// Ecuador: números de teléfono de 10 dígitos que inician en 0.
// WhatsApp requiere código de país: +593 (Ecuador).
// Conversión: quitar el 0 inicial y agregar 593.
// Ejemplo: "0987654321" → "59387654321"
//
// Se usa el esquema wa.me (nativo), NO la API de WhatsApp
// para evitar baneos por automatización.
// ============================================================

/** Código de país Ecuador para WhatsApp */
const CODIGO_PAIS_ECUADOR = "593";

/**
 * Convierte un teléfono ecuatoriano (10 dígitos, inicia en 0)
 * al formato internacional requerido por WhatsApp.
 *
 * @param telefono - "0987654321" (10 dígitos TEXT)
 * @returns "59387654321" (sin + para usar en URL)
 */
export function telefonoAWhatsApp(telefono: string): string {
  const telefonoLimpio = telefono.trim();

  // Remover el 0 inicial y agregar código Ecuador
  if (telefonoLimpio.startsWith("0") && telefonoLimpio.length === 10) {
    return CODIGO_PAIS_ECUADOR + telefonoLimpio.substring(1);
  }

  // Si ya tiene código de país (caso edge)
  if (telefonoLimpio.startsWith("593") && telefonoLimpio.length === 12) {
    return telefonoLimpio;
  }

  // Fallback: retornar tal cual
  return telefonoLimpio;
}

/**
 * Genera la URL de WhatsApp para enviar el ticket al líder del grupo.
 * El staff solo debe presionar "Enviar" en WhatsApp (no usa API).
 *
 * @param telefono - Teléfono del líder (10 dígitos, inicia en 0)
 * @param nombre - Nombre del líder
 * @param uuid - UUID único del ticket
 * @param cantidad - Número de asistentes en el grupo
 * @returns URL wa.me lista para redirect nativo
 */
export function generarUrlWhatsApp(
  telefono: string,
  nombre: string,
  uuid: string,
  cantidad: number
): string {
  const numeroWA = telefonoAWhatsApp(telefono);
  const urlTicket = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://novatada20261.vercel.app"}/ticket/${uuid}`;

  const mensaje = [
    `¡Hola ${nombre}! 🎉`,
    ``,
    `Tu entrada para la *Novatada ULEAM 2026* ha sido *aprobada*.`,
    `Grupo de ${cantidad} persona${cantidad !== 1 ? "s" : ""}.`,
    ``,
    `🎫 Aquí está tu ticket digital:`,
    urlTicket,
    ``,
    `Presenta este enlace en la puerta el *31 de julio de 2026*.`,
    ``,
    `— Asociación de Estudiantes Uleam Chone`,
  ].join("\n");

  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://api.whatsapp.com/send?phone=${numeroWA}&text=${mensajeCodificado}`;
}

/**
 * URL directa wa.me (alternativa más simple)
 * Ambas funcionan, pero api.whatsapp.com es más confiable en móvil.
 */
export function generarUrlWaMe(
  telefono: string,
  nombre: string,
  uuid: string,
  cantidad: number
): string {
  const numeroWA = telefonoAWhatsApp(telefono);
  const urlTicket = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://novatada20261.vercel.app"}/ticket/${uuid}`;

  const mensaje = encodeURIComponent(
    `¡Hola ${nombre}! Tu entrada Novatada ULEAM 2026 está aprobada (grupo de ${cantidad}). Ticket: ${urlTicket}`
  );

  return `https://wa.me/${numeroWA}?text=${mensaje}`;
}
