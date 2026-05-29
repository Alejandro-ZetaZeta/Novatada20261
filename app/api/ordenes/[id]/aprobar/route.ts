// ============================================================
// app/api/ordenes/[id]/aprobar/route.ts — Aprobar Orden
// PATCH /api/ordenes/[id]/aprobar
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { insforgeServidor, dbAdmin, decodeJwtSub } from "@/lib/insforge";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: ordenId } = await params;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const staffId = decodeJwtSub(token);
    if (!staffId) {
      return NextResponse.json({ error: "Token de staff inválido." }, { status: 401 });
    }

    // Verificar que el usuario es staff activo
    const { data: staff } = await dbAdmin
      .from("staff")
      .select("id, nombre, rol")
      .eq("id", staffId)
      .eq("activo", true)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "No tienes permisos de staff." }, { status: 403 });
    }

    // Obtener la orden
    const { data: orden, error: errorOrden } = await dbAdmin
      .from("ordenes")
      .select("id, estado, lider_id")
      .eq("id", ordenId)
      .single();

    if (errorOrden || !orden) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    if (orden.estado !== "pendiente") {
      return NextResponse.json(
        { error: `La orden ya está en estado "${orden.estado}".` },
        { status: 409 }
      );
    }

    // Actualizar orden → aprobada
    const { error: errorActOrden } = await dbAdmin
      .from("ordenes")
      .update({ estado: "aprobado", aprobado_por: staffId })
      .eq("id", ordenId);

    if (errorActOrden) {
      console.error("Error actualizando orden:", errorActOrden);
      return NextResponse.json({ error: "No se pudo aprobar la orden." }, { status: 500 });
    }

    // Activar tickets hijos → activo
    const { error: errorActTickets } = await dbAdmin
      .from("tickets")
      .update({ estado: "activo" })
      .eq("orden_id", ordenId);

    if (errorActTickets) {
      console.error("Error activando tickets:", errorActTickets);
      return NextResponse.json(
        { error: "Orden aprobada pero no se activaron los tickets." },
        { status: 500 }
      );
    }

    // Registrar en auditoría
    await dbAdmin.from("auditoria").insert([{
      orden_id: ordenId,
      accion: "aprobado",
      staff_id: staffId,
      metadata: { staff_nombre: staff.nombre, staff_rol: staff.rol },
    }]);

    return NextResponse.json({ ok: true, mensaje: "Orden aprobada y tickets activados." });

  } catch (err) {
    console.error("Error inesperado en PATCH /api/ordenes/[id]/aprobar:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
