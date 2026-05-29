// ============================================================
// app/api/ordenes/route.ts — Crear Orden + Tickets
// POST /api/ordenes
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, PRECIO_PREVENTA } from "@/lib/insforge";
import { validarCedula, validarTelefono } from "@/lib/validar-cedula";

export interface CuerpoCrearOrden {
  lider: {
    nombre: string;
    /** Teléfono: 10 dígitos TEXT, inicia en 0 */
    telefono: string;
    /** Cédula: 10 dígitos TEXT, puede iniciar en 0 */
    cedula: string;
  };
  cedulas: string[];
  comprobante_url?: string;
  comprobante_key?: string;
  fecha_transferencia?: string;
  num_referencia?: string;
  cuenta_origen?: string;
}

export async function POST(req: NextRequest) {
  try {
    const cuerpo: CuerpoCrearOrden = await req.json();
    const { lider, cedulas, comprobante_url, comprobante_key,
            fecha_transferencia, num_referencia, cuenta_origen } = cuerpo;

    // ── Validaciones básicas ──────────────────────────────────
    if (!lider?.nombre || !lider?.telefono || !lider?.cedula) {
      return NextResponse.json({ error: "Faltan datos del líder." }, { status: 400 });
    }
    if (!cedulas || cedulas.length === 0) {
      return NextResponse.json({ error: "Incluya al menos una cédula." }, { status: 400 });
    }

    const resultTelefono = validarTelefono(lider.telefono);
    if (!resultTelefono.valida) {
      return NextResponse.json({ error: resultTelefono.error }, { status: 400 });
    }

    const resultCedulaLider = validarCedula(lider.cedula);
    if (!resultCedulaLider.valida) {
      return NextResponse.json({ error: `Cédula del líder: ${resultCedulaLider.error}` }, { status: 400 });
    }

    if (!cedulas.includes(lider.cedula)) {
      return NextResponse.json({ error: "La cédula del líder debe estar en la lista." }, { status: 400 });
    }

    for (const cedula of cedulas) {
      const resultado = validarCedula(cedula);
      if (!resultado.valida) {
        return NextResponse.json({ error: `Cédula ${cedula}: ${resultado.error}` }, { status: 400 });
      }
    }

    const tieneImagen = comprobante_url && comprobante_key;
    const tieneTexto = fecha_transferencia && num_referencia && cuenta_origen;
    if (!tieneImagen && !tieneTexto) {
      return NextResponse.json({ error: "Debe proporcionar un comprobante." }, { status: 400 });
    }

    // ── Crear o recuperar líder ───────────────────────────────
    const { data: liderExistente } = await dbAdmin
      .from("lideres")
      .select("id")
      .eq("cedula", lider.cedula)
      .single();

    let liderId: string;

    if (liderExistente) {
      liderId = liderExistente.id;
      await dbAdmin
        .from("lideres")
        .update({ nombre: lider.nombre, telefono: lider.telefono })
        .eq("id", liderId);
    } else {
      const { data: nuevoLider, error: errorLider } = await dbAdmin
        .from("lideres")
        .insert([{ nombre: lider.nombre, telefono: lider.telefono, cedula: lider.cedula }])
        .select("id")
        .single();

      if (errorLider || !nuevoLider) {
        console.error("Error creando líder:", errorLider);
        return NextResponse.json({ error: "No se pudo registrar al líder." }, { status: 500 });
      }
      liderId = nuevoLider.id;
    }

    // ── Crear orden padre ─────────────────────────────────────
    const montoTotal = cedulas.length * PRECIO_PREVENTA;

    const { data: orden, error: errorOrden } = await dbAdmin
      .from("ordenes")
      .insert([{
        lider_id: liderId,
        estado: "pendiente",
        monto_total: montoTotal,
        comprobante_url: comprobante_url ?? null,
        comprobante_key: comprobante_key ?? null,
        fecha_transferencia: fecha_transferencia ?? null,
        num_referencia: num_referencia ?? null,
        cuenta_origen: cuenta_origen ?? null,
      }])
      .select("id")
      .single();

    if (errorOrden || !orden) {
      console.error("Error creando orden:", errorOrden);
      return NextResponse.json({ error: "No se pudo crear la orden." }, { status: 500 });
    }

    // ── Crear tickets hijos ───────────────────────────────────
    const tickets = cedulas.map((cedula) => ({
      orden_id: orden.id,
      cedula_asistente: cedula,
      estado: "pendiente",
      es_lider: cedula === lider.cedula,
    }));

    const { data: ticketsCreados, error: errorTickets } = await dbAdmin
      .from("tickets")
      .insert(tickets)
      .select("id, cedula_asistente, es_lider");

    if (errorTickets || !ticketsCreados) {
      console.error("Error creando tickets:", errorTickets);
      await dbAdmin.from("ordenes").delete().eq("id", orden.id);
      return NextResponse.json({ error: "No se pudo crear los tickets." }, { status: 500 });
    }

    const ticketLider = ticketsCreados.find((t) => t.es_lider);

    return NextResponse.json({
      ok: true,
      orden_id: orden.id,
      ticket_lider_uuid: ticketLider?.id,
      cantidad: cedulas.length,
      monto_total: montoTotal,
    });

  } catch (err) {
    console.error("Error inesperado en POST /api/ordenes:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
