alter table public.business_cards
  add column if not exists name text;

update public.business_cards
set name = coalesce(nullif(name, ''), person_name)
where name is null or name = '';

do $$
begin
  if to_regclass('public.cards') is not null then
    alter table public.cards
      add column if not exists name text;
  end if;
end $$;
