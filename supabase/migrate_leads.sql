-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Tarea 5: Preparar DB para migración de leads y eventos
-- ════════════════════════════════════════════════════════════════

-- 1. Agregar columna `ejecutivo` a leads (campo nuevo que hoy solo vive en frontend)
alter table public.leads
  add column if not exists ejecutivo text;

-- 2. Habilitar REPLICA IDENTITY FULL para que real-time mande payloads completos
--    (necesario para que cuando se borre un lead, el frontend sepa cuál fue)
alter table public.leads        replica identity full;
alter table public.eventos      replica identity full;
alter table public.seguimientos replica identity full;

-- 3. Agregar las tablas a la publicación de real-time
--    (esto activa las notificaciones de cambios en vivo)
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.eventos;
alter publication supabase_realtime add table public.seguimientos;

-- 4. Verificar que todo quedó bien
select 'ejecutivo column:' as check, count(*) as ok
  from information_schema.columns
  where table_schema = 'public' and table_name = 'leads' and column_name = 'ejecutivo'
union all
select 'realtime tables:', count(*)
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('leads','eventos','seguimientos');

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado:
--   ejecutivo column: 1
--   realtime tables:  3
-- ════════════════════════════════════════════════════════════════
