-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Tabla actividad (timeline de acciones — Configuración)
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- ════════════════════════════════════════════════════════════════

-- 1. Tabla
create table if not exists public.actividad (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references public.cuentas(id) on delete cascade,
  autor_id     uuid references public.cuentas(id) on delete set null,
  autor_nombre text not null default '',
  tipo         text not null,
  entidad      text not null,           -- 'lead' | 'evento'
  entidad_id   uuid,
  entidad_nombre text not null default '',
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- 2. Índice para listar últimas N por admin
create index if not exists actividad_admin_recent
  on public.actividad (admin_id, created_at desc);

-- 3. RLS
alter table public.actividad enable row level security;

-- Lecturas: admin ve su propio admin_id, asistentes ven el de su admin
drop policy if exists actividad_select on public.actividad;
create policy actividad_select on public.actividad
  for select
  to authenticated
  using (
    admin_id = auth.uid()
    or admin_id in (select admin_id from public.cuentas where id = auth.uid())
  );

-- Inserts: el autor debe ser el usuario logueado, y admin_id debe coincidir
drop policy if exists actividad_insert on public.actividad;
create policy actividad_insert on public.actividad
  for insert
  to authenticated
  with check (
    (autor_id = auth.uid() or autor_id is null)
    and (
      admin_id = auth.uid()
      or admin_id in (select admin_id from public.cuentas where id = auth.uid())
    )
  );

-- 4. Grants
grant select, insert on public.actividad to authenticated;

-- 5. Realtime (para que el timeline se actualice solo)
alter publication supabase_realtime add table public.actividad;

-- 6. Limpieza opcional: borra registros más viejos que 90 días (manual)
--    Si quieres dejarlo automatizado, agendar como pg_cron job:
--    delete from public.actividad where created_at < now() - interval '90 days';

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
