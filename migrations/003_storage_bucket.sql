-- ============================================================
-- MIGRACIÓN 003: BUCKET DE ALMACENAMIENTO PRIVADO
-- ============================================================
-- Los comprobantes de transferencia bancaria se guardan
-- en un bucket privado de InsForge. Las URLs firmadas
-- tienen duración corta (5 min) para el panel de staff.
-- ============================================================

-- Crear bucket privado para comprobantes
-- (Ejecutar vía InsForge CLI o API de storage)
-- pnpm dlx @insforge/cli storage create comprobantes --private

-- ============================================================
-- NOTA: Este archivo es documentación del bucket.
-- El bucket se crea vía CLI InsForge, no por SQL.
-- ============================================================

-- Configuración del bucket:
-- Nombre:    comprobantes
-- Privado:   true (requiere URL firmada para acceder)
-- Max size:  5MB por archivo
-- MIME:      image/jpeg, image/png, image/webp, image/heic

-- Política de acceso al bucket (InsForge storage RLS):
-- - Solo staff autenticado puede generar URLs firmadas
-- - El upload inicial lo hace el servidor (API route) usando service role key
-- - Los visitantes NO tienen acceso directo al bucket
