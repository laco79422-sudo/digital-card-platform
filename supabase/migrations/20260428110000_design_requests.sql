create table if not exists public.design_requests (
  id uuid primary key,
  user_id uuid null,
  name text not null,
  phone text not null,
  email text not null,
  business_type text not null,
  style text not null,
  reference_url text null,
  request_message text not null,
  status text not null default 'pending_payment',
  payment_status text not null default 'unpaid',
  assigned_designer_id uuid null,
  draft_image_url text null,
  final_card_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists design_requests_user_id_idx on public.design_requests(user_id);
create index if not exists design_requests_email_idx on public.design_requests(lower(email));
create index if not exists design_requests_assigned_designer_id_idx on public.design_requests(assigned_designer_id);
create index if not exists design_requests_status_idx on public.design_requests(status);

create or replace function public.set_design_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_design_requests_updated_at on public.design_requests;
create trigger set_design_requests_updated_at
before update on public.design_requests
for each row
execute function public.set_design_requests_updated_at();

alter table public.design_requests enable row level security;

drop policy if exists "design requests insert allowed" on public.design_requests;
create policy "design requests insert allowed"
on public.design_requests
for insert
with check (true);

drop policy if exists "design requests owner select" on public.design_requests;
create policy "design requests owner select"
on public.design_requests
for select
using (
  auth.uid() = user_id
  or auth.uid() = assigned_designer_id
  or lower(email) = lower(coalesce(auth.email(), ''))
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

drop policy if exists "design requests owner update" on public.design_requests;
create policy "design requests owner update"
on public.design_requests
for update
using (
  auth.uid() = user_id
  or auth.uid() = assigned_designer_id
  or lower(email) = lower(coalesce(auth.email(), ''))
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  auth.uid() = user_id
  or auth.uid() = assigned_designer_id
  or lower(email) = lower(coalesce(auth.email(), ''))
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

comment on table public.design_requests is
  '명함 디자인 제작 의뢰. profiles.role(user/designer/admin) 기반 권한으로 확장 예정.';
