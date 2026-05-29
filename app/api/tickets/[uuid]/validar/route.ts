// ============================================================
// app/api/tickets/[uuid]/validar/route.ts — Validar en Puerta
// POST /api/tickets/[uuid]/validar
// ============================================================
// REQUIERE autenticación de staff (Bearer token).
// Si una cámara no autorizada escanea el QR → 401.
// El estado del ticket NO cambia sin autorización.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, decodeJwtSub } from "@/lib/insforge";

interface Params {
  params: Promise<{ uuid: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { uuid } = await params;

    // BLINDAJE: Sin auth → 401 inmediato
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Solo el staff puede validar tickets." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const staffId = decodeJwtSub(token);
    if (!staffId) {
      return NextResponse.json(
        { error: "Token de staff inválido o expirado." },
        { status: 401 }
      );
    }

    // Verificar que sea staff activo
    const { data: staff } = await dbAdmin
      .from("staff")
      .select("id, nombre")
      .eq("id", staffId)
      .eq("activo", true)
      .single();

    if (!staff) {
      return NextResponse.json(
        { error: "No tienes permisos de staff para validar entradas." },
        { status: 403 }
      );
    }

    // Obtener el ticket por UUID
    const { data: ticket, error: errorTicket } = await dbAdmin
      .from("tickets")
      .select("id, estado, orden_id, ordenes(estado)")
      .eq("id", uuid)
      .single();

    if (errorTicket || !ticket) {
      return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });
    }

    const orden = Array.isArray(ticket.ordenes)
      ? ticket.ordenes[0]
      : ticket.ordenes as { estado: string } | null;

    if (orden?.estado !== "aprobado") {
      return NextResponse.json(
        { error: "Este ticket no está aprobado y no puede ser validado." },
        { status: 409 }
      );
    }

    // Verificar que no hayan sido ya usados
    const { data: ticketsOrden } = await dbAdmin
      .from("tickets")
      .select("id, estado, cedula_asistente")
      .eq("orden_id", ticket.orden_id);

    const yaUsados = ticketsOrden?.every((t) => t.estado === "usado");
    if (yaUsados) {
      return NextResponse.json(
        { error: "Este grupo ya fue validado e ingresó al evento." },
        { status: 409 }
      );
    }

    // Marcar todos los tickets como "usado" en bloque
    const { error: errorUsar } = await dbAdmin
      .from("tickets")
      .update({ estado: "usado" })
      .eq("orden_id", ticket.orden_id);

    if (errorUsar) {
      console.error("Error marcando tickets como usados:", errorUsar);
      return NextResponse.json({ error: "No se pudo confirmar el ingreso." }, { status: 500 });
    }

    // Registrar en auditoría
    await dbAdmin.from("auditoria").insert([{
      orden_id: ticket.orden_id,
      accion: "ingreso_confirmado",
      staff_id: staffId,
      metadata: {
        staff_nombre: staff.nombre,
        ticket_uuid: uuid,
        cantidad_personas: ticketsOrden?.length ?? 0,
        cedulas: ticketsOrden?.map((t) => t.cedula_asistente),
      },
    }]);

    return NextResponse.json({
      ok: true,
      mensaje: `Ingreso confirmado. ${ticketsOrden?.length ?? 0} persona(s) registradas.`,
      cantidad: ticketsOrden?.length ?? 0,
    });

  } catch (err) {
    console.error("Error inesperado en POST /api/tickets/[uuid]/validar:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
