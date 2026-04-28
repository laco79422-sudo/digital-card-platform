-- NFC 수락 확인 로그 + 공개 명함 조회 시 출처(source) 기록

create table if not exists public.nfc_accept_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null,
  status text not null default 'accepted',
  source text default 'nfc',
  user_agent text null,
  created_at timestamp with time zone not null default now()
);

create index if not exists nfc_accept_logs_card_id_idx on public.nfc_accept_logs(card_id);
create index if not exists nfc_accept_logs_created_at_idx on public.nfc_accept_logs(created_at desc);

alter table public.nfc_accept_logs enable row level security;

drop policy if exists "nfc_accept_logs insert public" on public.nfc_accept_logs;
create policy "nfc_accept_logs insert public"
on public.nfc_accept_logs
for insert
to anon, authenticated
with check (true);

do $$
begin
  if to_regclass('public.card_views') is null then
    create table public.card_views (
      id uuid primary key default gen_random_uuid(),
      card_id uuid not null,
      viewed_at timestamp with time zone not null default now(),
      referrer text null,
      user_agent text null,
      promoter_code text null,
      source text null
    );
    create index if not exists card_views_card_id_idx on public.card_views(card_id);
    alter table public.card_views enable row level security;
    drop policy if exists "card_views insert public" on public.card_views;
    create policy "card_views insert public"
    on public.card_views
    for insert
    to anon, authenticated
    with check (true);
  else
    alter table public.card_views
      add column if not exists source text null;
    alter table public.card_views enable row level security;
    drop policy if exists "card_views insert public" on public.card_views;
    create policy "card_views insert public"
    on public.card_views
    for insert
    to anon, authenticated
    with check (true);
  end if;
end $$;
