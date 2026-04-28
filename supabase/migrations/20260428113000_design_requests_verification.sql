alter table public.design_requests
  add column if not exists verified_name text not null default '',
  add column if not exists verified_phone text not null default '',
  add column if not exists verified_email text not null default '',
  add column if not exists email_verified boolean not null default false;

update public.design_requests
set
  verified_name = coalesce(nullif(verified_name, ''), name),
  verified_phone = coalesce(nullif(verified_phone, ''), phone),
  verified_email = coalesce(nullif(verified_email, ''), email),
  email_verified = coalesce(email_verified, false);
