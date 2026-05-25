-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Push notifications (Web Push API)
-- Tabla para guardar las suscripciones de cada dispositivo
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- ════════════════════════════════════════════════════════════════

-- 1. Tabla
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.cuentas(id) on delete cascade,
  admin_id    uuid not null references public.cuentas(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  device_info text,  -- iPhone Safari, Android Chrome, etc.
  created_at  timestamptz not null default now(),
  last_used   timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subs_admin on public.push_subscriptions (admin_id);
create index if not exists push_subs_user  on public.push_subscriptions (user_id);

-- 2. RLS
alter table public.push_subscriptions enable row level security;

drop policy if exists push_subs_select on public.push_subscriptions;
create policy push_subs_select on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subs_insert on public.push_subscriptions;
create policy push_subs_insert on public.push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_subs_delete on public.push_subscriptions;
create policy push_subs_delete on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subs_update on public.push_subscriptions;
create policy push_subs_update on public.push_subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Grants
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
