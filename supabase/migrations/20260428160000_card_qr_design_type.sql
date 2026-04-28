-- 명함 QR 이미지 URL 및 출력 템플릿 종류

alter table public.business_cards
  add column if not exists qr_image_url text null,
  add column if not exists design_type text not null default 'simple';

comment on column public.business_cards.qr_image_url is '공개 명함 URL 기준 QR PNG 저장 경로(공개 URL)';
comment on column public.business_cards.design_type is 'simple | business | emotional';

do $$
begin
  if to_regclass('public.cards') is not null then
    alter table public.cards
      add column if not exists qr_image_url text null,
      add column if not exists design_type text not null default 'simple';
  end if;
end $$;
