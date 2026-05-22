-- ════════════════════════════════════════════════════════════════
-- MARFLOW · SETUP DE AUTENTICACIÓN
-- ════════════════════════════════════════════════════════════════
-- Ejecuta este SQL en Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- TRIGGER: Cuando alguien se registra en auth.users,
-- crea automáticamente su perfil en public.cuentas
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.cuentas (id, nombre, usuario, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    -- Username único: prefijo del email + 4 caracteres del UUID
    coalesce(
      new.raw_user_meta_data->>'usuario',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    ),
    coalesce(new.raw_user_meta_data->>'rol', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- ¡LISTO!
-- Ahora puedes registrarte desde la app con email + contraseña.
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- DESPUÉS de que te registres con marianagnava@hotmail.com:
-- VUELVE A ESTE SQL EDITOR y ejecuta SOLO esta línea para
-- promoverte a superadmin (ver instrucciones abajo):
-- ════════════════════════════════════════════════════════════════
--
--   update public.cuentas
--   set rol = 'superadmin', nombre = 'Mariana', color = '#C6A96B'
--   where id = (select id from auth.users where email = 'marianagnava@hotmail.com');
--
-- ════════════════════════════════════════════════════════════════
