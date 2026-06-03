-- Supabase schema for the bathroom inventory management demo.
-- Run this in Supabase SQL Editor before enabling the app.

create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  article_code text not null unique,
  name text not null,
  manufacturer text,
  category text,
  unit text not null default 'vnt.',
  purchase_price numeric(14, 4) not null default 0,
  sale_price numeric(14, 4) not null default 0,
  vat_rate numeric(6, 2) not null default 21,
  current_stock numeric(14, 4) not null default 0,
  minimum_stock numeric(14, 4) not null default 0,
  warehouse_location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_code text,
  vat_code text,
  contact_person text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists receipt_documents (
  id uuid primary key default gen_random_uuid(),
  document_number text not null unique,
  supplier_id uuid not null references suppliers(id),
  supplier_document_number text,
  document_date date not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CONFIRMED', 'CANCELLED')),
  notes text,
  subtotal numeric(14, 4) not null default 0,
  vat_total numeric(14, 4) not null default 0,
  total numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create table if not exists receipt_document_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_document_id uuid not null references receipt_documents(id) on delete cascade,
  product_id uuid not null references products(id),
  article_code_snapshot text not null,
  product_name_snapshot text not null,
  unit_snapshot text not null,
  quantity numeric(14, 4) not null check (quantity > 0),
  unit_price numeric(14, 4) not null check (unit_price >= 0),
  vat_rate numeric(6, 2) not null default 21,
  line_subtotal numeric(14, 4) not null default 0,
  line_vat numeric(14, 4) not null default 0,
  line_total numeric(14, 4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  movement_type text not null check (movement_type in ('RECEIPT_CONFIRM', 'RECEIPT_CANCEL')),
  quantity_delta numeric(14, 4) not null,
  stock_after_movement numeric(14, 4) not null,
  reference_type text not null default 'RECEIPT_DOCUMENT',
  reference_id uuid not null references receipt_documents(id),
  reference_line_id uuid references receipt_document_lines(id),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_article_code on products using btree (article_code);
create index if not exists idx_products_search on products using gin (to_tsvector('simple', coalesce(article_code, '') || ' ' || coalesce(name, '')));
create index if not exists idx_receipt_documents_date_status on receipt_documents (document_date, status);
create index if not exists idx_receipt_documents_supplier on receipt_documents (supplier_id);
create index if not exists idx_stock_movements_product_date on stock_movements (product_id, created_at desc);
create index if not exists idx_stock_movements_reference on stock_movements (reference_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists trg_suppliers_updated_at on suppliers;
create trigger trg_suppliers_updated_at
before update on suppliers
for each row execute function set_updated_at();

drop trigger if exists trg_receipt_documents_updated_at on receipt_documents;
create trigger trg_receipt_documents_updated_at
before update on receipt_documents
for each row execute function set_updated_at();

create or replace function confirm_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document receipt_documents%rowtype;
  v_line receipt_document_lines%rowtype;
  v_stock_after numeric(14, 4);
begin
  select * into v_document
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Dokumentas nerastas.';
  end if;

  if v_document.status <> 'DRAFT' then
    raise exception 'Patvirtinti galima tik juodraštį.';
  end if;

  perform set_config('app.receipt_document_rpc', 'on', true);

  update receipt_documents
  set status = 'CONFIRMED', confirmed_at = now(), cancelled_at = null
  where id = p_document_id;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    perform 1 from products where id = v_line.product_id for update;

    update products
    set current_stock = current_stock + v_line.quantity,
        purchase_price = v_line.unit_price
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, reference_line_id, comment
    ) values (
      v_line.product_id, 'RECEIPT_CONFIRM', v_line.quantity, v_stock_after,
      'RECEIPT_DOCUMENT', p_document_id, v_line.id, 'Pajamavimo dokumentas patvirtintas'
    );
  end loop;
end;
$$;

create or replace function cancel_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document receipt_documents%rowtype;
  v_line receipt_document_lines%rowtype;
  v_current_stock numeric(14, 4);
  v_stock_after numeric(14, 4);
begin
  select * into v_document
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Dokumentas nerastas.';
  end if;

  if v_document.status <> 'CONFIRMED' then
    raise exception 'Atšaukti galima tik patvirtintą dokumentą.';
  end if;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    select current_stock into v_current_stock
    from products
    where id = v_line.product_id
    for update;

    if v_current_stock - v_line.quantity < 0 then
      raise exception 'Negalima atšaukti dokumento: prekės % likutis taptų neigiamas.', v_line.article_code_snapshot;
    end if;
  end loop;

  perform set_config('app.receipt_document_rpc', 'on', true);

  update receipt_documents
  set status = 'CANCELLED', cancelled_at = now()
  where id = p_document_id;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    update products
    set current_stock = current_stock - v_line.quantity
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, reference_line_id, comment
    ) values (
      v_line.product_id, 'RECEIPT_CANCEL', -v_line.quantity, v_stock_after,
      'RECEIPT_DOCUMENT', p_document_id, v_line.id, 'Pajamavimo dokumentas atšauktas'
    );
  end loop;
end;
$$;

create or replace function delete_draft_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Dokumentas nerastas.';
  end if;

  if v_status <> 'DRAFT' then
    raise exception 'Ištrinti galima tik juodraštį.';
  end if;

  delete from receipt_documents where id = p_document_id;
end;
$$;

create or replace function protect_receipt_document_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'DRAFT' then
      raise exception 'Ištrinti galima tik juodraštį.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.status <> 'DRAFT' and current_setting('app.receipt_document_rpc', true) <> 'on' then
      raise exception 'Patvirtintų arba atšauktų dokumentų tiesiogiai redaguoti negalima.';
    end if;

    if old.status = 'DRAFT' and new.status <> 'DRAFT' and current_setting('app.receipt_document_rpc', true) <> 'on' then
      raise exception 'Dokumento būseną galima keisti tik per patvirtinimo arba atšaukimo operaciją.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_receipt_documents on receipt_documents;
create trigger trg_protect_receipt_documents
before update or delete on receipt_documents
for each row execute function protect_receipt_document_changes();

create or replace function protect_receipt_document_lines()
returns trigger
language plpgsql
as $$
declare
  v_status text;
begin
  select status into v_status
  from receipt_documents
  where id = coalesce(new.receipt_document_id, old.receipt_document_id);

  if v_status <> 'DRAFT' then
    raise exception 'Patvirtinto arba atšaukto dokumento eilučių keisti negalima.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_receipt_document_lines on receipt_document_lines;
create trigger trg_protect_receipt_document_lines
before insert or update or delete on receipt_document_lines
for each row execute function protect_receipt_document_lines();

create or replace function protect_stock_movements()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.receipt_document_rpc', true) <> 'on' then
    raise exception 'Likučių istorijos įrašai kuriami tik per dokumento patvirtinimą arba atšaukimą.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_stock_movements on stock_movements;
create trigger trg_protect_stock_movements
before insert or update or delete on stock_movements
for each row execute function protect_stock_movements();

alter table products enable row level security;
alter table suppliers enable row level security;
alter table receipt_documents enable row level security;
alter table receipt_document_lines enable row level security;
alter table stock_movements enable row level security;

-- Authenticated-only policies for the internal application.
drop policy if exists "prototype_read_products" on products;
drop policy if exists "prototype_write_products" on products;
drop policy if exists "prototype_read_suppliers" on suppliers;
drop policy if exists "prototype_write_suppliers" on suppliers;
drop policy if exists "prototype_read_receipts" on receipt_documents;
drop policy if exists "prototype_write_receipts" on receipt_documents;
drop policy if exists "prototype_read_lines" on receipt_document_lines;
drop policy if exists "prototype_write_lines" on receipt_document_lines;
drop policy if exists "prototype_read_movements" on stock_movements;
drop policy if exists "authenticated_read_products" on products;
drop policy if exists "authenticated_write_products" on products;
drop policy if exists "authenticated_read_suppliers" on suppliers;
drop policy if exists "authenticated_write_suppliers" on suppliers;
drop policy if exists "authenticated_read_receipts" on receipt_documents;
drop policy if exists "authenticated_write_receipts" on receipt_documents;
drop policy if exists "authenticated_read_lines" on receipt_document_lines;
drop policy if exists "authenticated_write_lines" on receipt_document_lines;
drop policy if exists "authenticated_read_movements" on stock_movements;

create policy "authenticated_read_products"
on products for select
to authenticated
using (true);

create policy "authenticated_write_products"
on products for all
to authenticated
using (true)
with check (true);

create policy "authenticated_read_suppliers"
on suppliers for select
to authenticated
using (true);

create policy "authenticated_write_suppliers"
on suppliers for all
to authenticated
using (true)
with check (true);

create policy "authenticated_read_receipts"
on receipt_documents for select
to authenticated
using (true);

create policy "authenticated_write_receipts"
on receipt_documents for all
to authenticated
using (true)
with check (true);

create policy "authenticated_read_lines"
on receipt_document_lines for select
to authenticated
using (true);

create policy "authenticated_write_lines"
on receipt_document_lines for all
to authenticated
using (true)
with check (true);

create policy "authenticated_read_movements"
on stock_movements for select
to authenticated
using (true);

revoke execute on function confirm_receipt_document(uuid) from anon;
revoke execute on function cancel_receipt_document(uuid) from anon;
revoke execute on function delete_draft_receipt_document(uuid) from anon;
grant execute on function confirm_receipt_document(uuid) to authenticated;
grant execute on function cancel_receipt_document(uuid) to authenticated;
grant execute on function delete_draft_receipt_document(uuid) to authenticated;
