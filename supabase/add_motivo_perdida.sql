-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Motivo de pérdida en leads
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- Agrega la columna motivo_perdida para clasificar pérdidas del pipeline
-- (alimenta métricas futuras: ¿por qué se pierden los leads?)
-- ════════════════════════════════════════════════════════════════

alter table public.leads add column if not exists motivo_perdida text;

-- Backfill: leads con etapa legacy migrada a "perdido" reciben motivo por default.
-- Esto es opcional — solo si tienes leads con etapas viejas que quieres marcar.
update public.leads set motivo_perdida = 'no_contesto'
  where etapa = 'no_localiz' and motivo_perdida is null;
update public.leads set motivo_perdida = 'otro'
  where etapa = 'otro' and motivo_perdida is null;

-- Valores válidos sugeridos de motivo_perdida (no se enforza con CHECK
-- para mantener flexibilidad — la app valida en código):
--   'no_contesto'
--   'datos_erroneos'
--   'otro_distribuidor'
--   'no_asegurable'
--   'excluido'
--   'no_pidio_info'
--   'otro'

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
