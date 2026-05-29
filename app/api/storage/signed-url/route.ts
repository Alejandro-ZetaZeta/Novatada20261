// ============================================================
// app/api/storage/signed-url/route.ts — Proxy de Comprobante Privado
// GET /api/storage/signed-url?key=<object-key>
// ============================================================
// El SDK de InsForge no expone createSignedUrl.
// En su lugar: el servidor descarga el blob usando la service key
// (que bypasea RLS) y lo devuelve al navegador como stream.
// Solo accesible por staff autenticado (verifica Bearer token).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { insforgeServidor, decodeJwtSub, dbAdmin, BUCKET_COMPROBANTES } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  try {
    // ── Verificar que el solicitante sea staff activo ──────────
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
      .select("id")
      .eq("id", staffId)
      .eq("activo", true)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "Sin permisos de staff." }, { status: 403 });
    }

    // ── Obtener la key del objeto ──────────────────────────────
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Parámetro 'key' requerido." }, { status: 400 });
    }

    // ── Descargar el blob usando la service key (bypasea RLS) ──
    const bucket = insforgeServidor.storage.from(BUCKET_COMPROBANTES);
    const { data: blob, error } = await bucket.download(key);

    if (error || !blob) {
      console.error("Error descargando comprobante:", error);
      return NextResponse.json({ error: "No se pudo obtener el archivo." }, { status: 404 });
    }

    // ── Devolver el blob al navegador ─────────────────────────
    const arrayBuffer = await blob.arrayBuffer();
    const contentType = blob.type || "image/jpeg";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache corto: el staff verá la imagen fresca pero no se recargará innecesariamente
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("Error en GET /api/storage/signed-url:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
