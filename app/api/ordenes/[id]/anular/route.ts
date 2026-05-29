// ============================================================
// app/api/ordenes/[id]/anular/route.ts — Anular Orden
// POST /api/ordenes/[id]/anular
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, decodeJwtSub } from "@/lib/insforge";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: ordenId } = await params;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const staffId = decodeJwtSub(token);
    if (!staffId) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const { data: staff } = await dbAdmin
      .from("staff")
      .select("id, nombre, rol")
      .eq("id", staffId)
      .eq("activo", true)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "Sin permisos de staff." }, { status: 403 });
    }

    const esAdmin = (staff as { id: string; nombre: string; rol: string }).rol === "admin";

    // Staff regular: solo puede anular órdenes pendientes
    // Admin: puede anular cualquier estado (p.ej. reembolso de aprobadas)
    let queryAnular = dbAdmin
      .from("ordenes")
      .update({ estado: "anulado" })
      .eq("id", ordenId);

    if (!esAdmin) {
      queryAnular = queryAnular.eq("estado", "pendiente");
    }

    const { error: errAnular } = await queryAnular;

    if (errAnular) {
      return NextResponse.json({ error: "No se pudo anular la orden." }, { status: 500 });
    }

    await dbAdmin.from("auditoria").insert([{
      orden_id: ordenId,
      accion: "anulado",
      staff_id: staff.id,
      metadata: { staff_nombre: staff.nombre },
    }]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error anulando orden:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
