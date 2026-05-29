// ============================================================
// app/api/storage/upload-url/route.ts — Subida de Comprobante
// POST /api/storage/upload-url
// ============================================================
// El cliente envía la imagen directamente al servidor como
// FormData. El servidor la sube al bucket privado de InsForge
// usando el SDK y devuelve la URL y key resultantes.
// Esto evita exponer credenciales al navegador.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { insforgeServidor, BUCKET_COMPROBANTES } from "@/lib/insforge";
import { randomUUID } from "crypto";

/** Tipos MIME permitidos para comprobantes */
const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/** Tamaño máximo del archivo: 10 MB */
const TAMANO_MAXIMO = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const archivo = formData.get("archivo") as File | null;

    if (!archivo) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 });
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido. Use: ${TIPOS_PERMITIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({ error: "El archivo excede el límite de 10 MB." }, { status: 400 });
    }

    const extension = archivo.name.split(".").pop() ?? "jpg";
    const nombreArchivo = `${Date.now()}-${randomUUID()}.${extension}`;

    const bucket = insforgeServidor.storage.from(BUCKET_COMPROBANTES);
    const { data, error } = await bucket.upload(nombreArchivo, archivo);

    if (error || !data) {
      console.error("Error subiendo comprobante:", error);
      return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 500 });
    }

    const url = bucket.getPublicUrl(nombreArchivo);

    return NextResponse.json({
      ok: true,
      url,
      key: nombreArchivo,
    });

  } catch (err) {
    console.error("Error inesperado en POST /api/storage/upload-url:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
