-- ════════════════════════════════════════════════════════════════
-- MARFLOW · Fix timezone en enviar_recordatorios_eventos()
-- ════════════════════════════════════════════════════════════════
-- Ejecuta en: SQL Editor de Supabase
--
-- BUG:
--   La versión anterior aplicaba `at time zone 'America/Monterrey'`
--   sobre el timestamp del evento (izquierda del BETWEEN), pero la
--   derecha (`a.ts + interval …`) es timestamp sin tz que Postgres
--   promueve al timezone de la sesión (UTC en Supabase). Resultado:
--   los dos lados quedaban desfasados 6 horas y la notificación
--   llegaba ~6 horas después de la hora del evento (cita 1 PM →
--   notificación ~7 PM local).
--
-- FIX:
--   Quitar `at time zone 'America/Monterrey'` de la izquierda para
--   que ambos lados sean `timestamp` sin tz representando hora local
--   México. Comparación directa, sin promoción implícita.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.enviar_recordatorios_eventos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  declare
    r            record;
    v_payload    jsonb;
    v_title      text;
    v_body       text;
    v_hora_local text;
  begin
    for r in
      with
      ahora_mex as (
        select (now() at time zone 'America/Monterrey') as ts
      ),
      -- Eventos con hora específica, en ventana 60min
      eventos_60min as (
        select e.id as evento_id, e.admin_id, e.creador_id, e.titulo, e.tipo,
               e.fecha, e.hora_inicio, e.notas, e.lead_id, '60min'::text as subtipo
        from public.eventos e, ahora_mex a
        where e.hora_inicio is not null and e.hora_inicio <> ''
          and (e.fecha::timestamp + e.hora_inicio::interval)
              between a.ts + interval '55 minutes' and a.ts + interval '65 minutes'
      ),
      -- Eventos con hora específica, en ventana 15min
      eventos_15min as (
        select e.id, e.admin_id, e.creador_id, e.titulo, e.tipo,
               e.fecha, e.hora_inicio, e.notas, e.lead_id, '15min'
        from public.eventos e, ahora_mex a
        where e.hora_inicio is not null and e.hora_inicio <> ''
          and (e.fecha::timestamp + e.hora_inicio::interval)
              between a.ts + interval '13 minutes' and a.ts + interval '17 minutes'
      ),
      -- Eventos todo el día: hoy local México Y son 8 AM ±5
      eventos_todo_dia as (
        select e.id, e.admin_id, e.creador_id, e.titulo, e.tipo,
               e.fecha, e.hora_inicio, e.notas, e.lead_id, 'todo_dia'
        from public.eventos e, ahora_mex a
        where (e.hora_inicio is null or e.hora_inicio = '')
          and e.fecha = a.ts::date
          and extract(hour from a.ts) = 8
          and extract(minute from a.ts) between 0 and 9
      ),
      eventos_ventana as (
        select * from eventos_60min
        union all select * from eventos_15min
        union all select * from eventos_todo_dia
      ),
      -- Destinatarios: creador + asistentes del mismo admin del evento
      destinatarios as (
        select ev.evento_id, ev.admin_id, ev.titulo, ev.tipo, ev.fecha,
               ev.hora_inicio, ev.notas, ev.lead_id, ev.subtipo,
               c.id as user_id, c.rol as user_rol
        from eventos_ventana ev
        join public.cuentas c
          on (c.id = ev.creador_id)
          or (c.rol = 'asistente' and c.admin_id = ev.admin_id)
      )
      select d.*, l.nombre as lead_nombre
      from destinatarios d
      left join public.leads l on l.id = d.lead_id
      where not exists (
          select 1 from public.notificaciones_enviadas ne
          where ne.tipo_origen   = 'agenda_evento'
            and ne.subtipo       = d.subtipo
            and ne.referencia_id = d.evento_id
            and ne.user_id       = d.user_id
        )
        and exists (
          select 1 from public.push_subscriptions ps where ps.user_id = d.user_id
        )
    loop
      -- Hora local "10:00 AM" para texto
      v_hora_local := case
        when r.hora_inicio is null or r.hora_inicio = '' then ''
        else to_char(('2000-01-01 ' || r.hora_inicio)::timestamp, 'HH12:MI AM')
      end;

      -- Regla G: censura asistente en personal/viaje
      if r.user_rol = 'asistente' and r.tipo in ('personal','viaje') then
        if r.subtipo = 'todo_dia' then
          v_title := 'Ocupado todo el día';
        else
          v_title := 'Ocupado · ' || v_hora_local;
        end if;
        v_body := '';
      else
        v_title := case r.subtipo
          when '60min'    then 'En 1 hora: '  || r.titulo
          when '15min'    then 'En 15 min: '  || r.titulo
          when 'todo_dia' then 'Hoy: '        || r.titulo
        end;
        if r.lead_nombre is not null and r.lead_nombre <> '' then
          v_title := v_title || ' (con ' || r.lead_nombre || ')';
        end if;
        v_body := coalesce(r.notas, '');
      end if;

      v_payload := jsonb_build_object(
        'user_id',  r.user_id,
        'admin_id', r.admin_id,
        'title',    v_title,
        'body',     v_body,
        'url',      '/?seccion=agenda&fecha=' || r.fecha::text,
        'tag',      'evento-' || r.evento_id::text || '-' || r.subtipo
      );

      perform public._mf_invocar_edge_function(v_payload);

      insert into public.notificaciones_enviadas (
        tipo_origen, subtipo, referencia_id, user_id, admin_id
      ) values (
        'agenda_evento', r.subtipo, r.evento_id, r.user_id, r.admin_id
      )
      on conflict do nothing;
    end loop;
  end;
$function$;

-- ════════════════════════════════════════════════════════════════
-- Resultado esperado: "Success. No rows returned"
--
-- Verificación rápida (opcional):
--   Crea un evento con hora_inicio = hora actual + 60 min.
--   Espera 5 min. Deberías recibir la push "En 1 hora: ...".
-- ════════════════════════════════════════════════════════════════
