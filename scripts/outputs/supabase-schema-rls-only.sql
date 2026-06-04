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

create or replace function confirm_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as 'declare
  v_document receipt_documents%rowtype;
  v_line receipt_document_lines%rowtype;
  v_stock_after numeric(14, 4);
begin
  select * into v_document
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception ''Document not found.'';
  end if;

  if v_document.status <> ''DRAFT'' then
    raise exception ''Only draft documents can be confirmed.'';
  end if;

  update receipt_documents
  set status = ''CONFIRMED'', confirmed_at = now(), cancelled_at = null, updated_at = now()
  where id = p_document_id;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    perform 1 from products where id = v_line.product_id for update;

    update products
    set current_stock = current_stock + v_line.quantity,
        purchase_price = v_line.unit_price,
        updated_at = now()
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, reference_line_id, comment
    ) values (
      v_line.product_id, ''RECEIPT_CONFIRM'', v_line.quantity, v_stock_after,
      ''RECEIPT_DOCUMENT'', p_document_id, v_line.id, ''Receipt document confirmed''
    );
  end loop;
end;';

create or replace function cancel_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as 'declare
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
    raise exception ''Document not found.'';
  end if;

  if v_document.status <> ''CONFIRMED'' then
    raise exception ''Only confirmed documents can be cancelled.'';
  end if;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    select current_stock into v_current_stock
    from products
    where id = v_line.product_id
    for update;

    if v_current_stock - v_line.quantity < 0 then
      raise exception ''Cannot cancel document: product % stock would become negative.'', v_line.article_code_snapshot;
    end if;
  end loop;

  update receipt_documents
  set status = ''CANCELLED'', cancelled_at = now(), updated_at = now()
  where id = p_document_id;

  for v_line in
    select * from receipt_document_lines where receipt_document_id = p_document_id order by created_at
  loop
    update products
    set current_stock = current_stock - v_line.quantity,
        updated_at = now()
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, reference_line_id, comment
    ) values (
      v_line.product_id, ''RECEIPT_CANCEL'', -v_line.quantity, v_stock_after,
      ''RECEIPT_DOCUMENT'', p_document_id, v_line.id, ''Receipt document cancelled''
    );
  end loop;
end;';

create or replace function delete_draft_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as 'declare
  v_status text;
begin
  select status into v_status
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception ''Document not found.'';
  end if;

  if v_status <> ''DRAFT'' then
    raise exception ''Only draft documents can be deleted.'';
  end if;

  delete from receipt_documents where id = p_document_id;
end;';

alter table products enable row level security;
alter table suppliers enable row level security;
alter table receipt_documents enable row level security;
alter table receipt_document_lines enable row level security;
alter table stock_movements enable row level security;

drop policy if exists "prototype_read_products" on products;
drop policy if exists "prototype_write_products" on products;
drop policy if exists "authenticated_read_products" on products;
drop policy if exists "authenticated_write_products" on products;
drop policy if exists "authenticated_select_products" on products;
drop policy if exists "authenticated_insert_products" on products;
drop policy if exists "authenticated_update_products" on products;
drop policy if exists "authenticated_delete_products" on products;

drop policy if exists "prototype_read_suppliers" on suppliers;
drop policy if exists "prototype_write_suppliers" on suppliers;
drop policy if exists "authenticated_read_suppliers" on suppliers;
drop policy if exists "authenticated_write_suppliers" on suppliers;
drop policy if exists "authenticated_select_suppliers" on suppliers;
drop policy if exists "authenticated_insert_suppliers" on suppliers;
drop policy if exists "authenticated_update_suppliers" on suppliers;
drop policy if exists "authenticated_delete_suppliers" on suppliers;

drop policy if exists "prototype_read_receipts" on receipt_documents;
drop policy if exists "prototype_write_receipts" on receipt_documents;
drop policy if exists "authenticated_read_receipts" on receipt_documents;
drop policy if exists "authenticated_write_receipts" on receipt_documents;
drop policy if exists "authenticated_select_receipts" on receipt_documents;
drop policy if exists "authenticated_insert_draft_receipts" on receipt_documents;
drop policy if exists "authenticated_update_draft_receipts" on receipt_documents;
drop policy if exists "authenticated_delete_draft_receipts" on receipt_documents;

drop policy if exists "prototype_read_lines" on receipt_document_lines;
drop policy if exists "prototype_write_lines" on receipt_document_lines;
drop policy if exists "authenticated_read_lines" on receipt_document_lines;
drop policy if exists "authenticated_write_lines" on receipt_document_lines;
drop policy if exists "authenticated_select_lines" on receipt_document_lines;
drop policy if exists "authenticated_insert_draft_lines" on receipt_document_lines;
drop policy if exists "authenticated_update_draft_lines" on receipt_document_lines;
drop policy if exists "authenticated_delete_draft_lines" on receipt_document_lines;

drop policy if exists "prototype_read_movements" on stock_movements;
drop policy if exists "authenticated_read_movements" on stock_movements;
drop policy if exists "authenticated_select_movements" on stock_movements;

create policy "authenticated_select_products" on products for select to authenticated using (true);
create policy "authenticated_insert_products" on products for insert to authenticated with check (true);
create policy "authenticated_update_products" on products for update to authenticated using (true) with check (true);
create policy "authenticated_delete_products" on products for delete to authenticated using (true);

create policy "authenticated_select_suppliers" on suppliers for select to authenticated using (true);
create policy "authenticated_insert_suppliers" on suppliers for insert to authenticated with check (true);
create policy "authenticated_update_suppliers" on suppliers for update to authenticated using (true) with check (true);
create policy "authenticated_delete_suppliers" on suppliers for delete to authenticated using (true);

create policy "authenticated_select_receipts" on receipt_documents for select to authenticated using (true);
create policy "authenticated_insert_draft_receipts" on receipt_documents for insert to authenticated with check (status = 'DRAFT');
create policy "authenticated_update_draft_receipts" on receipt_documents for update to authenticated using (status = 'DRAFT') with check (status = 'DRAFT');
create policy "authenticated_delete_draft_receipts" on receipt_documents for delete to authenticated using (status = 'DRAFT');

create policy "authenticated_select_lines" on receipt_document_lines for select to authenticated using (true);
create policy "authenticated_insert_draft_lines" on receipt_document_lines for insert to authenticated with check (exists (select 1 from receipt_documents where receipt_documents.id = receipt_document_lines.receipt_document_id and receipt_documents.status = 'DRAFT'));
create policy "authenticated_update_draft_lines" on receipt_document_lines for update to authenticated using (exists (select 1 from receipt_documents where receipt_documents.id = receipt_document_lines.receipt_document_id and receipt_documents.status = 'DRAFT')) with check (exists (select 1 from receipt_documents where receipt_documents.id = receipt_document_lines.receipt_document_id and receipt_documents.status = 'DRAFT'));
create policy "authenticated_delete_draft_lines" on receipt_document_lines for delete to authenticated using (exists (select 1 from receipt_documents where receipt_documents.id = receipt_document_lines.receipt_document_id and receipt_documents.status = 'DRAFT'));

create policy "authenticated_select_movements" on stock_movements for select to authenticated using (true);

revoke execute on function confirm_receipt_document(uuid) from public;
revoke execute on function cancel_receipt_document(uuid) from public;
revoke execute on function delete_draft_receipt_document(uuid) from public;
grant execute on function confirm_receipt_document(uuid) to authenticated;
grant execute on function cancel_receipt_document(uuid) to authenticated;
grant execute on function delete_draft_receipt_document(uuid) to authenticated;

grant usage on schema public to authenticated;

revoke all privileges on table products from anon;
revoke all privileges on table suppliers from anon;
revoke all privileges on table receipt_documents from anon;
revoke all privileges on table receipt_document_lines from anon;
revoke all privileges on table stock_movements from anon;

revoke all privileges on table products from public;
revoke all privileges on table suppliers from public;
revoke all privileges on table receipt_documents from public;
revoke all privileges on table receipt_document_lines from public;
revoke all privileges on table stock_movements from public;

grant select, insert, update, delete on table products to authenticated;
grant select, insert, update, delete on table suppliers to authenticated;
grant select, insert, update, delete on table receipt_documents to authenticated;
grant select, insert, update, delete on table receipt_document_lines to authenticated;
grant select on table stock_movements to authenticated;
revoke insert, update, delete on table stock_movements from authenticated;
