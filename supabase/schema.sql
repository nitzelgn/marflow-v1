-- ════════════════════════════════════════════════════════════════
-- MARFLOW · ESQUEMA DE BASE DE DATOS (Supabase / PostgreSQL)
-- ════════════════════════════════════════════════════════════════
-- Multi-tenant: cada admin (asesor) tiene su propio espacio aislado.
-- Asistentes heredan del admin al que pertenecen.
-- Superadmin (Mariana) ve todo.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1) CUENTAS — perfiles de usuario (extiende auth.users de Supabase)
-- ────────────────────────────────────────────────────────────────
-- Supabase Auth maneja email/password en auth.users.
-- Aquí guardamos los metadatos de Marflow (rol, color, admin_id).
create table public.cuentas (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  usuario     text unique not null,
  rol         text not null check (rol in ('superadmin','admin','asistente')),
  color       text default '#C6A96B',
  admin_id    uuid references public.cuentas(id) on delete set null,
  created_at  timestamptz default now()
);

create index idx_cuentas_admin_id on public.cuentas(admin_id);

-- ────────────────────────────────────────────────────────────────
-- 2) LEADS — el corazón de la app
-- ────────────────────────────────────────────────────────────────
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references public.cuentas(id) on delete cascade,
  asignado_a      uuid references public.cuentas(id) on delete set null,

  -- Datos del lead
  nombre          text not null,
  telefono        text,
  correo          text,
  edad            text,
  producto        text,
  estado          text,

  -- Pipeline
  etapa           text not null default 'nuevo'
                  check (etapa in ('nuevo','cita','asesorado','seguimiento','no_localiz','cierre','otro')),
  ultimo_contacto date,
  sin_seguimiento boolean default false,

  -- Texto libre
  notas           text,
  objeciones      text,
  intereses       text,
  motivador       text,

  -- Checklist (JSONB para flexibilidad)
  checklist       jsonb default '{"wa1":false,"wa2":false,"call1":false,"call2":false,"email":false,"sigues":false,"noInteres":false}'::jsonb,

  mes_creacion    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_leads_admin on public.leads(admin_id);
create index idx_leads_etapa on public.leads(admin_id, etapa);
create index idx_leads_asignado on public.leads(asignado_a);
create index idx_leads_ultimo_contacto on public.leads(ultimo_contacto);

-- Trigger para mantener updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 3) SEGUIMIENTOS — historial de interacciones con cada lead
-- ────────────────────────────────────────────────────────────────
create table public.seguimientos (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  autor_id    uuid references public.cuentas(id) on delete set null,
  fecha       date not null default current_date,
  tipo        text,  -- 'llamada' | 'whatsapp' | 'correo' | 'reunion' | etc.
  texto       text not null,
  created_at  timestamptz default now()
);

create index idx_seg_lead on public.seguimientos(lead_id, fecha desc);
create index idx_seg_autor_fecha on public.seguimientos(autor_id, fecha);

-- ────────────────────────────────────────────────────────────────
-- 4) EVENTOS — agenda
-- ────────────────────────────────────────────────────────────────
create table public.eventos (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references public.cuentas(id) on delete cascade,
  creador_id   uuid references public.cuentas(id) on delete set null,
  lead_id      uuid references public.leads(id) on delete set null,

  titulo       text not null,
  tipo         text not null check (tipo in ('trabajo','cita','viaje','personal')),
  subtipo      text,
  fecha        date not null,
  hora         text,  -- '14:30' o null
  repeticion   text default 'none' check (repeticion in ('none','weekly','monthly','yearly')),
  notas        text,
  privado      boolean default false,  -- true → solo el creador lo ve

  created_at   timestamptz default now()
);

create index idx_eventos_admin_fecha on public.eventos(admin_id, fecha);
create index idx_eventos_lead on public.eventos(lead_id);

-- ────────────────────────────────────────────────────────────────
-- 5) ACTIVIDAD — tracking para métricas avanzadas ⭐
-- ────────────────────────────────────────────────────────────────
-- Esta tabla alimenta:
--   • Tiempo total al día en la app
--   • Mejor día de la semana
--   • Mejor horario para recibir respuestas del cliente
--   • Patrones de uso del asesor
create table public.actividad (
  id          bigserial primary key,
  cuenta_id   uuid not null references public.cuentas(id) on delete cascade,
  lead_id     uuid references public.leads(id) on delete set null,

  evento      text not null check (evento in (
    'app_open',          -- el usuario abrió la app
    'app_close',         -- cerró/se fue
    'app_ping',          -- ping cada 60s mientras está activa (para calcular tiempo)
    'lead_contactado',   -- el asesor mandó mensaje/llamada
    'lead_respondio',    -- el cliente respondió ⭐ (clave para "mejor horario")
    'cita_creada',
    'cierre_logrado'
  )),

  metadata    jsonb default '{}'::jsonb,
  ocurrido_en timestamptz not null default now()
);

create index idx_actividad_cuenta_fecha on public.actividad(cuenta_id, ocurrido_en desc);
create index idx_actividad_evento on public.actividad(evento, ocurrido_en);
create index idx_actividad_lead on public.actividad(lead_id);

-- ────────────────────────────────────────────────────────────────
-- 6) COBRANZA — renovaciones y pólizas vigentes
-- ────────────────────────────────────────────────────────────────
create table public.cobranza (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references public.cuentas(id) on delete cascade,
  lead_id         uuid references public.leads(id) on delete set null,

  cliente         text not null,
  poliza          text,
  producto        text,  -- 'GMMI','PLU3','EDU','Auto','Vida','Hogar','Otro'
  prima           numeric(12,2),
  moneda          text default 'MXN',
  fecha_pago      date,
  fecha_renovacion date,
  estatus         text default 'vigente'
                  check (estatus in ('vigente','atrasada','renovar','cancelada','pagada')),
  notas           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_cobranza_admin on public.cobranza(admin_id);
create index idx_cobranza_renovacion on public.cobranza(fecha_renovacion);

create trigger trg_cobranza_updated_at
  before update on public.cobranza
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════
-- Cada admin solo ve sus datos. Asistentes ven los datos de su admin.
-- Superadmin ve todo.
-- ════════════════════════════════════════════════════════════════

alter table public.cuentas       enable row level security;
alter table public.leads         enable row level security;
alter table public.seguimientos  enable row level security;
alter table public.eventos       enable row level security;
alter table public.actividad     enable row level security;
alter table public.cobranza      enable row level security;

-- Helper: ¿qué admin_id le corresponde al usuario actual?
-- Si es admin → su propio id
-- Si es asistente → el admin_id al que pertenece
-- Si es superadmin → null (ve todo)
create or replace function public.mi_admin_id()
returns uuid
language sql security definer stable
as $$
  select case
    when rol = 'superadmin' then null
    when rol = 'asistente'  then admin_id
    else id
  end
  from public.cuentas where id = auth.uid()
$$;

create or replace function public.es_superadmin()
returns boolean
language sql security definer stable
as $$
  select rol = 'superadmin' from public.cuentas where id = auth.uid()
$$;

-- ── CUENTAS ──
-- Cada usuario ve su propio perfil. Admin ve sus asistentes. Superadmin ve todos.
create policy cuentas_select on public.cuentas for select using (
  id = auth.uid()
  or admin_id = auth.uid()
  or public.es_superadmin()
);
create policy cuentas_insert on public.cuentas for insert with check (
  id = auth.uid() or public.es_superadmin()
);
create policy cuentas_update on public.cuentas for update using (
  id = auth.uid() or public.es_superadmin()
);

-- ── LEADS / SEGUIMIENTOS / EVENTOS / ACTIVIDAD / COBRANZA ──
-- Política genérica: ves los datos cuyo admin_id coincide con tu mi_admin_id().
-- Superadmin ve todo (mi_admin_id devuelve null → bypass).

create policy leads_all on public.leads for all
  using (public.es_superadmin() or admin_id = public.mi_admin_id())
  with check (public.es_superadmin() or admin_id = public.mi_admin_id());

create policy seg_all on public.seguimientos for all
  using (
    public.es_superadmin()
    or exists (select 1 from public.leads l where l.id = lead_id and l.admin_id = public.mi_admin_id())
  )
  with check (
    public.es_superadmin()
    or exists (select 1 from public.leads l where l.id = lead_id and l.admin_id = public.mi_admin_id())
  );

create policy eventos_all on public.eventos for all
  using (
    public.es_superadmin()
    or (admin_id = public.mi_admin_id() and (privado = false or creador_id = auth.uid()))
  )
  with check (
    public.es_superadmin()
    or admin_id = public.mi_admin_id()
  );

create policy actividad_all on public.actividad for all
  using (
    public.es_superadmin()
    or cuenta_id = auth.uid()
    or exists (select 1 from public.cuentas c where c.id = cuenta_id and c.admin_id = public.mi_admin_id())
  )
  with check (cuenta_id = auth.uid());

create policy cobranza_all on public.cobranza for all
  using (public.es_superadmin() or admin_id = public.mi_admin_id())
  with check (public.es_superadmin() or admin_id = public.mi_admin_id());

-- ════════════════════════════════════════════════════════════════
-- GRANTS — privilegios base para el rol authenticated
-- (las policies RLS aplican encima — solo verá las filas permitidas)
-- ════════════════════════════════════════════════════════════════

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on public.cuentas      to authenticated;
grant select, insert, update, delete on public.leads        to authenticated;
grant select, insert, update, delete on public.seguimientos to authenticated;
grant select, insert, update, delete on public.eventos      to authenticated;
grant select, insert, update, delete on public.actividad    to authenticated;
grant select, insert, update, delete on public.cobranza     to authenticated;

grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.mi_admin_id()   to authenticated;
grant execute on function public.es_superadmin() to authenticated;

-- ════════════════════════════════════════════════════════════════
-- LISTO. Para correr este script:
--   1. Entra a tu proyecto en supabase.com
--   2. SQL Editor → New query
--   3. Pega TODO este archivo y ejecuta (Run)
--   4. Verifica en Table Editor que las 6 tablas estén creadas
-- ════════════════════════════════════════════════════════════════
