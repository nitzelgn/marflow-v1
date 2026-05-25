-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Email Lead Ingestion (Fase 1)
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- Agrega metadata de importación a la tabla leads sin tocar datos
-- existentes. Todas las columnas son nullable; los leads previos
-- quedan con source='manual' por default.
-- ════════════════════════════════════════════════════════════════

-- 1. Columnas nuevas en leads
alter table public.leads add column if not exists source           text default 'manual';
alter table public.leads add column if not exists source_detail    text;
alter table public.leads add column if not exists imported_at      timestamptz;
alter table public.leads add column if not exists raw_email_text   text;
alter table public.leads add column if not exists imported_by      uuid references public.cuentas(id) on delete set null;
alter table public.leads add column if not exists import_batch_id  uuid;

-- 2. Backfill: leads existentes son 'manual' (por si quedó alguna fila con NULL)
update public.leads set source = 'manual' where source is null;

-- 3. Índice para queries por batch (futuro: "ver todos los leads de esta importación")
create index if not exists idx_leads_import_batch on public.leads(import_batch_id);
create index if not exists idx_leads_source       on public.leads(admin_id, source);

-- Valores válidos sugeridos de source (no se enforza con CHECK para mantener
-- flexibilidad — la app valida en código):
--   'manual'         — captura directa en la app
--   'csv_import'     — importado desde Excel/CSV
--   'email_allianz'  — correo de Allianz
--   'email_leslie'   — correo de Leslie
--   'email_ale'      — correo de Ale
--   'email_otro'     — correo de otro remitente
--   'referral'       — referido manual
--   'website'        — captura desde web (futuro)

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
