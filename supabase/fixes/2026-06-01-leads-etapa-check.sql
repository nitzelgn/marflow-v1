-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Fix: leads_etapa_check — ampliar a etapas refactorizadas
-- Aplicado: 2026-06-01
-- ════════════════════════════════════════════════════════════════
--
-- PROBLEMA RESUELTO
-- ─────────────────────────────────────────────────────────────────
-- Al editar o mover un lead en el Pipeline, Supabase rechazaba el
-- UPDATE con:
--   code:    23514
--   message: 'new row for relation "leads" violates check
--             constraint "leads_etapa_check"'
--
-- CAUSA
-- ─────────────────────────────────────────────────────────────────
-- El refactor del 29-may movió el catálogo de etapas en el frontend
-- (src/App.jsx ~líneas 27-39) de 7 nombres legacy a 6 modernos:
--   nuevo, contactado, interesado, cotizacion, venta, perdido
-- Pero el CHECK constraint en la DB seguía permitiendo solo las
-- 7 legacy del schema original:
--   nuevo, cita, asesorado, seguimiento, no_localiz, cierre, otro
-- El mapa _ETAPA_MIGRACION del frontend solo aplicaba AL LEER, no
-- AL ESCRIBIR. Cualquier guardado con etapa nueva → rechazado.
--
-- FIX APLICADO
-- ─────────────────────────────────────────────────────────────────
-- Reemplazar el CHECK por uno ampliado que acepta AMBOS sets:
--   - 6 etapas modernas (catálogo activo del frontend)
--   - 6 etapas legacy (compatibilidad con leads históricos en DB)
-- Total: 12 valores aceptados (nuevo cuenta en ambos sets, se
-- lista una sola vez).
--
-- RIESGO: cero
-- ─────────────────────────────────────────────────────────────────
-- - No toca datos de leads existentes
-- - No toca RLS ni GRANTs ni otras tablas
-- - PostgreSQL valida el nuevo CHECK contra las filas existentes;
--   como todos los valores actuales (legacy o nuevos) están en la
--   lista de 12, valida instantáneo sin error.
-- - Idempotente: re-ejecutar es seguro.
-- ════════════════════════════════════════════════════════════════

alter table public.leads
  drop constraint if exists leads_etapa_check;

alter table public.leads
  add constraint leads_etapa_check
  check (etapa in (
    -- Etapas modernas (catálogo activo del frontend)
    'nuevo',
    'contactado',
    'interesado',
    'cotizacion',
    'venta',
    'perdido',
    -- Etapas legacy (compatibilidad con leads históricos)
    'cita',
    'asesorado',
    'seguimiento',
    'no_localiz',
    'cierre',
    'otro'
  ));

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════
--
-- VERIFICACIÓN POSTERIOR (opcional)
-- ─────────────────────────────────────────────────────────────────
-- SELECT con.conname, pg_get_constraintdef(con.oid)
-- FROM   pg_constraint con
-- JOIN   pg_class      cls ON cls.oid = con.conrelid
-- JOIN   pg_namespace  ns  ON ns.oid  = cls.relnamespace
-- WHERE  ns.nspname  = 'public'
--   AND  cls.relname = 'leads'
--   AND  con.conname = 'leads_etapa_check';
-- → debe devolver 1 fila con los 12 valores listados
-- ════════════════════════════════════════════════════════════════
