-- ============================================================
-- MIGRACIÓN 005: GRANTS DE TABLA
-- ============================================================
-- Los GRANTs habilitan el acceso de nivel tabla.
-- Las políticas RLS (002) controlan el acceso a nivel fila.
-- Sin GRANTs, PostgreSQL lanza "permission denied" antes de
-- evaluar cualquier política RLS.
-- ============================================================

-- ── Rol anon (visitantes públicos) ───────────────────────────
GRANT INSERT ON TABLE lideres TO anon;
GRANT INSERT ON TABLE ordenes TO anon;
GRANT INSERT ON TABLE tickets TO anon;
GRANT SELECT ON TABLE tickets TO anon;  -- para consulta pública de estado vía API

-- ── Rol authenticated (staff y admin comparten este rol en BD) ─
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE lideres   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ordenes   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tickets   TO authenticated;
GRANT SELECT, UPDATE               ON TABLE staff      TO authenticated;
GRANT SELECT, INSERT               ON TABLE auditoria  TO authenticated;
