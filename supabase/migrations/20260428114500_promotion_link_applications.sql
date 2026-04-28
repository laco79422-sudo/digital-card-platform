alter table public.business_cards
  add column if not exists promotion_enabled boolean not null default false,
  add column if not exists promotion_payment_status text not null default 'unpaid',
  add column if not exists promotion_price integer not null default 10900;

do $$
begin
  if to_regclass('public.cards') is not null then
    alter table public.cards
      add column if not exists promotion_enabled boolean not null default false,
      add column if not exists promotion_payment_status text not null default 'unpaid',
      add column if not exists promotion_price integer not null default 10900;
  end if;
end $$;

create table if not exists public.promotion_applications (
  id uuid primary key,
  card_id uuid,
  applicant_user_id uuid,
  owner_user_id uuid,
  status text not null default 'pending',
  promoter_code text unique,
  promotion_url text,
  created_at timestamp with time zone not null default now(),
  approved_at timestamp with time zone null
);

create index if not exists promotion_applications_card_id_idx on public.promotion_applications(card_id);
create index if not exists promotion_applications_applicant_user_id_idx on public.promotion_applications(applicant_user_id);
create index if not exists promotion_applications_owner_user_id_idx on public.promotion_applications(owner_user_id);
create index if not exists promotion_applications_status_idx on public.promotion_applications(status);

alter table public.promotion_applications enable row level security;

drop policy if exists "promotion applications insert own" on public.promotion_applications;
create policy "promotion applications insert own"
on public.promotion_applications
for insert
with check (auth.uid() = applicant_user_id);

drop policy if exists "promotion applications select related" on public.promotion_applications;
create policy "promotion applications select related"
on public.promotion_applications
for select
using (auth.uid() = applicant_user_id or auth.uid() = owner_user_id);

drop policy if exists "promotion applications update owner or applicant" on public.promotion_applications;
create policy "promotion applications update owner or applicant"
on public.promotion_applications
for update
using (auth.uid() = applicant_user_id or auth.uid() = owner_user_id)
with check (auth.uid() = applicant_user_id or auth.uid() = owner_user_id);

do $$
begin
  if to_regclass('public.card_views') is not null then
    alter table public.card_views
      add column if not exists promoter_code text null;
  end if;
end $$;
