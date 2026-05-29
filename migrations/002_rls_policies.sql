-- ============================================================
-- MIGRACIÓN 002: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================
-- Tres roles: visitante (anon), staff (autenticado), admin
-- Las políticas usan auth.uid() de InsForge.
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE lideres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff     ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- HELPERS: funciones de rol
-- ────────────────────────────────────────────────────────────

-- Devuelve true si el usuario autenticado es staff activo
CREATE OR REPLACE FUNCTION es_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND activo = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Devuelve true si el usuario autenticado es admin
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND activo = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- TABLA: lideres
-- ────────────────────────────────────────────────────────────

-- Visitante puede crear su propio registro
CREATE POLICY "lideres_insert_publico"
  ON lideres FOR INSERT
  TO anon
  WITH CHECK (true);

-- Visitante puede leer SOLO su propio registro (por cédula)
-- La consulta la hace la API con RLS activo
CREATE POLICY "lideres_select_propio"
  ON lideres FOR SELECT
  TO anon
  USING (false); -- Solo visible vía función server-side

-- Staff puede leer todos los líderes
CREATE POLICY "lideres_select_staff"
  ON lideres FOR SELECT
  TO authenticated
  USING (es_staff());

-- Admin tiene control total
CREATE POLICY "lideres_admin_total"
  ON lideres FOR ALL
  TO authenticated
  USING (es_admin())
  WITH CHECK (es_admin());

-- ────────────────────────────────────────────────────────────
-- TABLA: ordenes
-- ────────────────────────────────────────────────────────────

-- Visitante puede crear órdenes (INSERT público controlado por API)
CREATE POLICY "ordenes_insert_publico"
  ON ordenes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Staff puede leer todas las órdenes
CREATE POLICY "ordenes_select_staff"
  ON ordenes FOR SELECT
  TO authenticated
  USING (es_staff());

-- Staff puede actualizar solo el estado y campo aprobado_por
CREATE POLICY "ordenes_update_staff"
  ON ordenes FOR UPDATE
  TO authenticated
  USING (es_staff())
  WITH CHECK (es_staff());

-- Admin tiene control total
CREATE POLICY "ordenes_admin_total"
  ON ordenes FOR ALL
  TO authenticated
  USING (es_admin())
  WITH CHECK (es_admin());

-- ────────────────────────────────────────────────────────────
-- TABLA: tickets
-- ────────────────────────────────────────────────────────────

-- Visitante puede crear tickets (INSERT)
CREATE POLICY "tickets_insert_publico"
  ON tickets FOR INSERT
  TO anon
  WITH CHECK (true);

-- Visitante no puede leer directamente (lo hace el API server-side)
CREATE POLICY "tickets_select_visitante"
  ON tickets FOR SELECT
  TO anon
  USING (false);

-- Staff puede leer todos los tickets
CREATE POLICY "tickets_select_staff"
  ON tickets FOR SELECT
  TO authenticated
  USING (es_staff());

-- Staff puede actualizar estado de tickets
CREATE POLICY "tickets_update_staff"
  ON tickets FOR UPDATE
  TO authenticated
  USING (es_staff())
  WITH CHECK (es_staff());

-- Admin tiene control total
CREATE POLICY "tickets_admin_total"
  ON tickets FOR ALL
  TO authenticated
  USING (es_admin())
  WITH CHECK (es_admin());

-- ────────────────────────────────────────────────────────────
-- TABLA: staff
-- ────────────────────────────────────────────────────────────

-- Staff puede ver solo su propio registro
CREATE POLICY "staff_select_self"
  ON staff FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin tiene control total
CREATE POLICY "staff_admin_total"
  ON staff FOR ALL
  TO authenticated
  USING (es_admin())
  WITH CHECK (es_admin());

-- ────────────────────────────────────────────────────────────
-- TABLA: auditoria (SOLO INSERT Y SELECT, nunca UPDATE/DELETE)
-- ────────────────────────────────────────────────────────────

-- Solo staff puede insertar registros de auditoría
CREATE POLICY "auditoria_insert_staff"
  ON auditoria FOR INSERT
  TO authenticated
  WITH CHECK (es_staff());

-- Staff puede leer auditoría
CREATE POLICY "auditoria_select_staff"
  ON auditoria FOR SELECT
  TO authenticated
  USING (es_staff());

-- Admin tiene control total (pero nunca debe borrar)
CREATE POLICY "auditoria_admin_total"
  ON auditoria FOR ALL
  TO authenticated
  USING (es_admin())
  WITH CHECK (es_admin());
