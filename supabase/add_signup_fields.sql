-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Agregar campos de signup (teléfono + estado)
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- ════════════════════════════════════════════════════════════════

-- 1. Agregar columnas nuevas a la tabla cuentas
alter table public.cuentas add column if not exists telefono text;
alter table public.cuentas add column if not exists estado   text;

-- 2. Actualizar el trigger handle_new_user para que copie telefono y estado
--    desde el user_metadata que mandamos en supabase.auth.signUp({ ..., options: { data: {...} } })
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.cuentas (id, nombre, usuario, rol, telefono, estado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'usuario',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    ),
    coalesce(new.raw_user_meta_data->>'rol', 'admin'),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'estado'
  )
  on conflict (id) do update
    set telefono = coalesce(excluded.telefono, public.cuentas.telefono),
        estado   = coalesce(excluded.estado,   public.cuentas.estado);
  return new;
end;
$$;

-- 3. Verificar que las columnas y el trigger están bien
select 'columnas nuevas:' as check, count(*) as ok
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'cuentas'
    and column_name in ('telefono','estado')
union all
select 'trigger activo:', count(*)
  from pg_trigger
  where tgname = 'on_auth_user_created';

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado:
--   columnas nuevas: 2
--   trigger activo:  1
-- ════════════════════════════════════════════════════════════════
