-- Supabase Dashboard → SQL Editor에서 한 번 실행하세요.
-- PostgREST RPC 이름: public.is_email_registered(p_email text)
-- anon / authenticated 가 execute 할 수 있어야 클라이언트에서 호출됩니다.

create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated;
