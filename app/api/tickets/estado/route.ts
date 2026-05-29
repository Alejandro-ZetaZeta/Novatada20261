// ============================================================
// app/api/tickets/estado/route.ts — Consultar Estado por Cédula
// GET /api/tickets/estado?cedula=0912345678
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/insforge";
import { validarCedula } from "@/lib/validar-cedula";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cedula = searchParams.get("cedula")?.trim();

    if (!cedula) {
      return NextResponse.json({ error: "Debe ingresar su número de cédula." }, { status: 400 });
    }

    const validacion = validarCedula(cedula);
    if (!validacion.valida) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }

    const { data: tickets, error } = await dbAdmin
      .from("tickets")
      .select(`
        id,
        estado,
        es_lider,
        created_at,
        ordenes (
          id,
          estado,
          monto_total,
          created_at
        )
      `)
      .eq("cedula_asistente", cedula)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error consultando tickets:", error);
      return NextResponse.json({ error: "No se pudo consultar el estado." }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        encontrado: false,
        mensaje: "No se encontraron tickets para esa cédula.",
      });
    }

    const resultados = tickets.map((ticket) => ({
      estado_ticket: ticket.estado,
      es_lider: ticket.es_lider,
      estado_orden: Array.isArray(ticket.ordenes)
        ? ticket.ordenes[0]?.estado
        : (ticket.ordenes as { estado: string } | null)?.estado,
      fecha_compra: ticket.created_at,
    }));

    return NextResponse.json({
      encontrado: true,
      cedula,
      tickets: resultados,
    });

  } catch (err) {
    console.error("Error inesperado en GET /api/tickets/estado:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
