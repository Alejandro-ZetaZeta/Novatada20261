-- ============================================================
-- MIGRACIÓN 004: CORRECCIÓN DE RECOMENDACIONES DE SEGURIDAD Y RENDIMIENTO
-- ============================================================

-- 1. Indexar llaves foráneas para rendimiento en JOINs y cascadas
CREATE INDEX IF NOT EXISTS idx_ordenes_aprobado_por ON public.ordenes(aprobado_por);
CREATE INDEX IF NOT EXISTS idx_auditoria_staff_id ON public.auditoria(staff_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_ticket_id ON public.auditoria(ticket_id);

-- 2. Asegurar funciones utilizando SECURITY INVOKER (ejecutan con privilegios del llamador)
CREATE OR REPLACE FUNCTION public.es_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = auth.uid()
    AND activo = true
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND activo = true
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE;

-- 3. Limitar privilegios de ejecución de funciones de RLS
REVOKE EXECUTE ON FUNCTION public.es_staff() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.es_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_admin() TO authenticated;

-- 4. Fortalecer políticas RLS de inserción pública (anon) para evitar registros maliciosos
-- Tabla: lideres
DROP POLICY IF EXISTS "lideres_insert_publico" ON public.lideres;
CREATE POLICY "lideres_insert_publico"
  ON public.lideres FOR INSERT
  TO anon
  WITH CHECK (
    length(nombre) >= 3 
    AND telefono ~ '^\d{10}$' 
    AND cedula ~ '^\d{10}$'
  );

-- Tabla: ordenes
DROP POLICY IF EXISTS "ordenes_insert_publico" ON public.ordenes;
CREATE POLICY "ordenes_insert_publico"
  ON public.ordenes FOR INSERT
  TO anon
  WITH CHECK (
    estado = 'pendiente' 
    AND aprobado_por IS NULL
  );

-- Tabla: tickets
DROP POLICY IF EXISTS "tickets_insert_publico" ON public.tickets;
CREATE POLICY "tickets_insert_publico"
  ON public.tickets FOR INSERT
  TO anon
  WITH CHECK (
    estado = 'pendiente'
  );

-- 5. Optimización de rendimiento en RLS (subquery wrapper para auth.uid())
DROP POLICY IF EXISTS "staff_select_self" ON public.staff;
CREATE POLICY "staff_select_self"
  ON public.staff FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));
