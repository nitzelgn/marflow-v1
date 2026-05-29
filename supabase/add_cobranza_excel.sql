-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Persistencia de Cobranza en Supabase
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- Permite que el Excel de Cobranza se guarde CROSS-DEVICE (no solo
-- en localStorage del dispositivo actual). Una sola fila por admin
-- con la última versión del Excel cargado.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.cobranza_excel (
  admin_id    uuid primary key references public.cuentas(id) on delete cascade,
  datos       jsonb not null default '[]'::jsonb,
  updated_at  timestamptz default now()
);

-- Trigger para mantener updated_at
create or replace function public.set_cobranza_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_cobranza_excel_updated_at on public.cobranza_excel;
create trigger trg_cobranza_excel_updated_at
  before update on public.cobranza_excel
  for each row execute function public.set_cobranza_updated_at();

-- RLS: cada admin solo ve su propio Excel; asistentes ven el de su admin
alter table public.cobranza_excel enable row level security;

drop policy if exists "cobranza_excel_select_own" on public.cobranza_excel;
create policy "cobranza_excel_select_own" on public.cobranza_excel
  for select using (
    admin_id = auth.uid()
    or admin_id = (select admin_id from public.cuentas where id = auth.uid())
  );

drop policy if exists "cobranza_excel_upsert_own" on public.cobranza_excel;
create policy "cobranza_excel_upsert_own" on public.cobranza_excel
  for insert with check (admin_id = auth.uid());

drop policy if exists "cobranza_excel_update_own" on public.cobranza_excel;
create policy "cobranza_excel_update_own" on public.cobranza_excel
  for update using (admin_id = auth.uid());

drop policy if exists "cobranza_excel_delete_own" on public.cobranza_excel;
create policy "cobranza_excel_delete_own" on public.cobranza_excel
  for delete using (admin_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
