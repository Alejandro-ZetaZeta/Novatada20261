-- ============================================================
-- MIGRACIÓN 001: ESQUEMA INICIAL - SISTEMA NOVATADA ULEAM 2026
-- ============================================================
-- IMPORTANTE: cédulas y teléfonos ecuatorianos se almacenan
-- como TEXT para preservar ceros iniciales (ej: 0912345678).
-- ============================================================

-- Extensión para UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- TABLA: lideres
-- Un líder es el comprador/responsable del grupo.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lideres (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  -- Teléfono en Ecuador: 10 dígitos, inicia en 0 (ej: 0987654321)
  telefono    TEXT        NOT NULL CHECK (telefono ~ '^\d{10}$'),
  -- Cédula ecuatoriana: 10 dígitos, puede iniciar en 0
  cedula      TEXT        NOT NULL UNIQUE CHECK (cedula ~ '^\d{10}$'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: staff
-- Miembros de la asociación con acceso al panel interno.
-- El rol se gestiona en InsForge auth + esta tabla.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  rol         TEXT        NOT NULL DEFAULT 'staff' CHECK (rol IN ('staff', 'admin')),
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: ordenes
-- Orden padre que agrupa N tickets de un grupo.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordenes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id            UUID        NOT NULL REFERENCES lideres(id),
  estado              TEXT        NOT NULL DEFAULT 'pendiente'
                                  CHECK (estado IN ('pendiente', 'aprobado', 'anulado')),
  monto_total         NUMERIC(10,2) NOT NULL CHECK (monto_total > 0),
  -- Comprobante vía multimedia (URL firmada + key en bucket InsForge)
  comprobante_url     TEXT,
  comprobante_key     TEXT,
  -- Comprobante vía texto (respaldo para señal débil)
  fecha_transferencia TEXT,
  num_referencia      TEXT,
  cuenta_origen       TEXT,
  -- Quién del staff aprobó la orden
  aprobado_por        UUID        REFERENCES staff(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ordenes_updated_at
  BEFORE UPDATE ON ordenes
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ────────────────────────────────────────────────────────────
-- TABLA: tickets
-- Tickets hijos (uno por cédula en el grupo).
-- UUID inadivinable como identificador público del ticket.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id          UUID        NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  -- Cédula del asistente: TEXT para preservar cero inicial
  cedula_asistente  TEXT        NOT NULL CHECK (cedula_asistente ~ '^\d{10}$'),
  estado            TEXT        NOT NULL DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente', 'activo', 'usado')),
  -- ¿Este ticket pertenece al líder?
  es_lider          BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ────────────────────────────────────────────────────────────
-- TABLA: auditoria
-- Registro inmutable de todas las acciones críticas.
-- NO TIENE UPDATE ni DELETE (enforced por RLS).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id    UUID        REFERENCES ordenes(id),
  ticket_id   UUID        REFERENCES tickets(id),
  accion      TEXT        NOT NULL, -- 'aprobado', 'anulado', 'ingreso_confirmado', 'venta_rapida'
  staff_id    UUID        REFERENCES staff(id),
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES DE RENDIMIENTO
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lideres_cedula   ON lideres(cedula);
CREATE INDEX IF NOT EXISTS idx_ordenes_lider    ON ordenes(lider_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado   ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_orden    ON tickets(orden_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cedula   ON tickets(cedula_asistente);
CREATE INDEX IF NOT EXISTS idx_tickets_estado   ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_orden  ON auditoria(orden_id);
