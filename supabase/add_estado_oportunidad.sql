-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Estado de oportunidad (reemplaza el concepto "temperatura")
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
-- ════════════════════════════════════════════════════════════════

-- 1. Columnas nuevas en leads
alter table public.leads add column if not exists estado_oportunidad text;
alter table public.leads add column if not exists es_referido       boolean default false;
alter table public.leads add column if not exists referido_por      text;
alter table public.leads add column if not exists pausa_hasta       date;

-- Valores válidos de estado_oportunidad (manual, asignado por el asesor):
--   'muy_interesado'    — cliente receptivo y activo
--   'alta_oportunidad'  — referido o alta probabilidad de cierre (auto cuando es_referido=true)
--   'seguimiento_debil' — pocas interacciones o muchos días sin actividad (auto)
--   'en_pausa'          — cliente pidió esperar; usar pausa_hasta para retomar
--   'patrimonial'       — perfil de alto ticket / capacidad financiera

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
