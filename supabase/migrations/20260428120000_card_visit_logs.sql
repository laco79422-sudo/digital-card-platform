-- 방문 추적(공개 명함 ref 파라미터 등)

create table if not exists public.card_visit_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.business_cards(id) on delete cascade,
  card_slug text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  promoter_code text null,
  source text not null default 'direct',
  visitor_user_agent text null,
  visited_at timestamp with time zone not null default now(),
  constraint card_visit_logs_source_check check (source in ('direct', 'promotion')),
  constraint card_visit_logs_promoter_when_promotion check (
    (source = 'promotion' and promoter_code is not null)
    or (source = 'direct' and promoter_code is null)
  )
);

create index if not exists idx_card_visit_logs_owner on public.card_visit_logs(owner_user_id);
create index if not exists idx_card_visit_logs_card on public.card_visit_logs(card_id);
create index if not exists idx_card_visit_logs_promoter on public.card_visit_logs(promoter_code) where promoter_code is not null;

alter table public.promotion_applications
  add column if not exists applicant_name text null,
  add column if not exists applicant_email text null;

alter table public.card_visit_logs enable row level security;

-- 소유자: 자신 명함의 로그 조회
create policy "Owners can select visit logs for own cards"
  on public.card_visit_logs for select
  to authenticated
  using (owner_user_id = auth.uid());

-- 공개 페이지에서 방문 한 번 기록(anon)
create policy "Anyone can insert visit logs"
  on public.card_visit_logs for insert
  to anon, authenticated
  with check (true);

-- 승인된 홍보자: 자신의 promoter_code 로그만 조회
create policy "Promoters can select own promotion visits"
  on public.card_visit_logs for select
  to authenticated
  using (
    promoter_code is not null
    and exists (
      select 1 from public.promotion_applications pa
      where pa.promoter_code = card_visit_logs.promoter_code
        and pa.applicant_user_id = auth.uid()
        and pa.status = 'approved'
    )
  );

grant select on public.card_visit_logs to authenticated;
grant insert on public.card_visit_logs to anon, authenticated;
