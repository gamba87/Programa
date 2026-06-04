create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists accounting_settings (
  id text primary key default 'main' check (id = 'main'),
  company_name text not null default '',
  company_code text not null default '',
  vat_code text not null default '',
  address text not null default '',
  email text not null default '',
  phone text not null default '',
  default_currency text not null default 'EUR',
  software_name text not null default 'Inventoriaus valdymas',
  software_version text not null default '1.0',
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists accounting_settings_set_updated_at on accounting_settings;
create trigger accounting_settings_set_updated_at
before update on accounting_settings
for each row
execute function set_updated_at();

alter table accounting_settings enable row level security;

revoke all on table accounting_settings from anon;
revoke all on table accounting_settings from public;
grant select, insert, update on table accounting_settings to authenticated;

drop policy if exists "Authenticated users can read accounting settings" on accounting_settings;
drop policy if exists "Authenticated users can insert accounting settings" on accounting_settings;
drop policy if exists "Authenticated users can update accounting settings" on accounting_settings;

create policy "Authenticated users can read accounting settings"
on accounting_settings
for select
to authenticated
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert accounting settings"
on accounting_settings
for insert
to authenticated
with check (auth.role() = 'authenticated' and id = 'main');

create policy "Authenticated users can update accounting settings"
on accounting_settings
for update
to authenticated
using (auth.role() = 'authenticated' and id = 'main')
with check (auth.role() = 'authenticated' and id = 'main');

insert into accounting_settings (
  id,
  company_name,
  company_code,
  vat_code,
  address,
  email,
  phone,
  software_name,
  software_version
)
values (
  'main',
  '',
  '',
  '',
  '',
  '',
  '',
  'Inventoriaus valdymas',
  '1.0'
)
on conflict (id) do nothing;
