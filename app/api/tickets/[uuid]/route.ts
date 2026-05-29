// ============================================================
// app/api/tickets/[uuid]/route.ts — Datos del Ticket Público
// GET /api/tickets/[uuid]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/insforge";

interface Params {
  params: Promise<{ uuid: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json({ error: "UUID requerido." }, { status: 400 });
    }

    const { data: ticket, error } = await dbAdmin
      .from("tickets")
      .select(`
        id,
        estado,
        es_lider,
        orden_id,
        ordenes (
          id,
          estado,
          monto_total,
          created_at,
          lideres (
            nombre,
            telefono
          )
        )
      `)
      .eq("id", uuid)
      .eq("es_lider", true)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });
    }

    const orden = Array.isArray(ticket.ordenes)
      ? ticket.ordenes[0]
      : ticket.ordenes as {
          id: string;
          estado: string;
          monto_total: number;
          created_at: string;
          lideres: { nombre: string; telefono: string } | null;
        } | null;

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    const { data: todosTickets } = await dbAdmin
      .from("tickets")
      .select("id, cedula_asistente, estado, es_lider")
      .eq("orden_id", ticket.orden_id)
      .order("es_lider", { ascending: false });

    const lider = Array.isArray(orden.lideres)
      ? orden.lideres[0]
      : orden.lideres as { nombre: string; telefono: string } | null;

    return NextResponse.json({
      uuid: ticket.id,
      estado: ticket.estado,
      estado_orden: orden.estado,
      nombre_lider: lider?.nombre ?? "—",
      cantidad_personas: todosTickets?.length ?? 1,
      fecha_compra: orden.created_at,
      asistentes: todosTickets?.map((t) => ({
        cedula_masked: enmascararCedula(t.cedula_asistente),
        es_lider: t.es_lider,
        estado: t.estado,
      })) ?? [],
    });

  } catch (err) {
    console.error("Error inesperado en GET /api/tickets/[uuid]:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

function enmascararCedula(cedula: string): string {
  if (cedula.length !== 10) return "**********";
  return cedula.substring(0, 3) + "****" + cedula.substring(7);
}
