-- Sales module for the bathroom inventory management system.
-- Run this whole file once in Supabase SQL Editor after the base inventory schema is installed.

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

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_type text not null default 'COMPANY' check (customer_type in ('COMPANY', 'PERSON')),
  name text not null,
  company_code text,
  vat_code text,
  address text,
  email text,
  phone text,
  contact_person text,
  notes text,
  is_active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('OFFER', 'ORDER', 'PREPAYMENT_INVOICE', 'INVOICE', 'DELIVERY_NOTE')),
  document_number text not null unique,
  customer_id uuid not null references customers(id),
  customer_document_number text,
  document_date date not null default current_date,
  due_date date,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
  currency text not null default 'EUR',
  responsible_employee text,
  notes text,
  subtotal numeric(14, 4) not null default 0,
  discount_total numeric(14, 4) not null default 0,
  vat_total numeric(14, 4) not null default 0,
  total numeric(14, 4) not null default 0,
  paid_amount numeric(14, 4) not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create table if not exists sales_document_lines (
  id uuid primary key default gen_random_uuid(),
  sales_document_id uuid not null references sales_documents(id) on delete cascade,
  product_id uuid not null references products(id),
  article_code_snapshot text not null,
  product_name_snapshot text not null,
  unit_snapshot text not null default 'vnt.',
  quantity numeric(14, 4) not null check (quantity > 0),
  unit_price numeric(14, 4) not null check (unit_price >= 0),
  discount_percent numeric(6, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  vat_rate numeric(6, 2) not null default 21,
  line_subtotal numeric(14, 4) not null default 0,
  line_discount numeric(14, 4) not null default 0,
  line_vat numeric(14, 4) not null default 0,
  line_total numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references sales_documents(id) on delete cascade,
  target_document_id uuid not null references sales_documents(id) on delete cascade,
  relation_type text not null default 'CONVERTED_TO',
  created_at timestamptz not null default now(),
  constraint document_relations_not_self check (source_document_id <> target_document_id),
  constraint document_relations_unique unique (source_document_id, target_document_id, relation_type)
);

create table if not exists stock_reservations (
  id uuid primary key default gen_random_uuid(),
  sales_document_id uuid not null references sales_documents(id) on delete cascade,
  sales_document_line_id uuid not null references sales_document_lines(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14, 4) not null check (quantity > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELLED', 'CONVERTED')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  sales_document_id uuid not null references sales_documents(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14, 4) not null check (amount > 0),
  payment_method text not null check (payment_method in ('BANK_TRANSFER', 'CASH', 'CARD', 'OTHER')),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_search on customers using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(company_code, '') || ' ' || coalesce(email, '')));
create unique index if not exists idx_customers_company_code_unique on customers(company_code) where company_code is not null and company_code <> '';
create index if not exists idx_sales_documents_customer_date on sales_documents(customer_id, document_date desc);
create index if not exists idx_sales_documents_type_status on sales_documents(document_type, status);
create index if not exists idx_sales_documents_number on sales_documents(document_number);
create index if not exists idx_sales_lines_document on sales_document_lines(sales_document_id);
create index if not exists idx_sales_lines_product on sales_document_lines(product_id);
create index if not exists idx_document_relations_source on document_relations(source_document_id);
create index if not exists idx_document_relations_target on document_relations(target_document_id);
create index if not exists idx_reservations_product_active on stock_reservations(product_id, status);
create unique index if not exists idx_active_reservation_per_line on stock_reservations(sales_document_line_id) where status = 'ACTIVE';
create index if not exists idx_payments_document_date on payments(sales_document_id, payment_date desc);

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at before update on customers for each row execute function set_updated_at();

drop trigger if exists trg_sales_documents_updated_at on sales_documents;
create trigger trg_sales_documents_updated_at before update on sales_documents for each row execute function set_updated_at();

drop trigger if exists trg_sales_lines_updated_at on sales_document_lines;
create trigger trg_sales_lines_updated_at before update on sales_document_lines for each row execute function set_updated_at();

alter table stock_movements add column if not exists sales_document_id uuid references sales_documents(id);
alter table stock_movements add column if not exists sales_document_line_id uuid references sales_document_lines(id);
alter table stock_movements add column if not exists reference_number text;
alter table stock_movements alter column reference_id drop not null;
alter table stock_movements drop constraint if exists stock_movements_movement_type_check;
alter table stock_movements add constraint stock_movements_movement_type_check
  check (movement_type in ('RECEIPT_CONFIRM', 'RECEIPT_CANCEL', 'ISSUE', 'ISSUE_REVERSAL'));

create or replace function generate_sales_document_number(p_document_type text, p_document_date date)
returns text
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_prefix text;
  v_month text;
  v_next integer;
begin
  v_prefix := case p_document_type
    when 'OFFER' then 'PAS'
    when 'ORDER' then 'UZS'
    when 'PREPAYMENT_INVOICE' then 'IS'
    when 'INVOICE' then 'SF'
    when 'DELIVERY_NOTE' then 'VAZ'
    else 'PD'
  end;
  v_month := to_char(coalesce(p_document_date, current_date), 'YYYY-MM');
  v_prefix := v_prefix || '-' || v_month || '-';

  perform pg_advisory_xact_lock(hashtext('sales-number-' || p_document_type || '-' || v_month));

  select coalesce(max(substring(document_number from '[0-9]+$')::integer), 0) + 1
    into v_next
  from sales_documents
  where document_number like v_prefix || '%';

  return v_prefix || lpad(v_next::text, 3, '0');
end;
$function$;

create or replace function assign_sales_document_number()
returns trigger
language plpgsql
as $function$
begin
  if new.document_number is null or btrim(new.document_number) = '' then
    new.document_number := generate_sales_document_number(new.document_type, new.document_date);
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_assign_sales_document_number on sales_documents;
create trigger trg_assign_sales_document_number
before insert on sales_documents
for each row execute function assign_sales_document_number();

create or replace function set_sales_line_totals()
returns trigger
language plpgsql
as $function$
declare
  v_gross numeric(14, 4);
begin
  v_gross := new.quantity * new.unit_price;
  new.line_discount := round(v_gross * (new.discount_percent / 100), 4);
  new.line_subtotal := greatest(0, round(v_gross - new.line_discount, 4));
  new.line_vat := round(new.line_subtotal * (new.vat_rate / 100), 4);
  new.line_total := new.line_subtotal + new.line_vat;
  return new;
end;
$function$;

drop trigger if exists trg_set_sales_line_totals on sales_document_lines;
create trigger trg_set_sales_line_totals
before insert or update on sales_document_lines
for each row execute function set_sales_line_totals();

create or replace function recalculate_sales_document_totals(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_subtotal numeric(14, 4);
  v_discount numeric(14, 4);
  v_vat numeric(14, 4);
  v_total numeric(14, 4);
  v_paid numeric(14, 4);
begin
  select
    coalesce(sum(line_subtotal), 0),
    coalesce(sum(line_discount), 0),
    coalesce(sum(line_vat), 0),
    coalesce(sum(line_total), 0)
  into v_subtotal, v_discount, v_vat, v_total
  from sales_document_lines
  where sales_document_id = p_document_id;

  select coalesce(sum(amount), 0)
    into v_paid
  from payments
  where sales_document_id = p_document_id;

  update sales_documents
  set subtotal = v_subtotal,
      discount_total = v_discount,
      vat_total = v_vat,
      total = v_total,
      paid_amount = v_paid
  where id = p_document_id;
end;
$function$;

create or replace function refresh_sales_document_totals_trigger()
returns trigger
language plpgsql
as $function$
begin
  if tg_op = 'DELETE' then
    perform recalculate_sales_document_totals(old.sales_document_id);
    return old;
  end if;
  perform recalculate_sales_document_totals(new.sales_document_id);
  return new;
end;
$function$;

drop trigger if exists trg_refresh_sales_totals on sales_document_lines;
create trigger trg_refresh_sales_totals
after insert or update or delete on sales_document_lines
for each row execute function refresh_sales_document_totals_trigger();

create or replace function create_stock_reservation(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_document sales_documents%rowtype;
  v_line sales_document_lines%rowtype;
  v_current_stock numeric(14, 4);
  v_reserved numeric(14, 4);
  v_free numeric(14, 4);
begin
  select * into v_document
  from sales_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document not found.';
  end if;
  if v_document.document_type <> 'ORDER' then
    raise exception 'Only orders can reserve stock.';
  end if;
  if v_document.status = 'CANCELLED' then
    raise exception 'Cancelled documents cannot reserve stock.';
  end if;

  update stock_reservations
  set status = 'CANCELLED', released_at = now()
  where sales_document_id = p_document_id and status = 'ACTIVE';

  for v_line in
    select * from sales_document_lines where sales_document_id = p_document_id order by created_at for update
  loop
    select current_stock into v_current_stock
    from products
    where id = v_line.product_id
    for update;

    select coalesce(sum(quantity), 0) into v_reserved
    from stock_reservations
    where product_id = v_line.product_id and status = 'ACTIVE';

    v_free := coalesce(v_current_stock, 0) - coalesce(v_reserved, 0);
    if v_free < v_line.quantity then
      raise exception 'Not enough free stock for %. Free: %, requested: %.', v_line.article_code_snapshot, v_free, v_line.quantity;
    end if;

    insert into stock_reservations (
      sales_document_id, sales_document_line_id, product_id, quantity, created_by
    ) values (
      p_document_id, v_line.id, v_line.product_id, v_line.quantity, auth.uid()
    );
  end loop;

  update sales_documents
  set status = 'CONFIRMED'
  where id = p_document_id and status = 'DRAFT';
end;
$function$;

create or replace function cancel_stock_reservation(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update stock_reservations
  set status = 'CANCELLED', released_at = now()
  where sales_document_id = p_document_id and status = 'ACTIVE';
end;
$function$;

create or replace function confirm_delivery_note(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_document sales_documents%rowtype;
  v_line sales_document_lines%rowtype;
  v_current_stock numeric(14, 4);
  v_stock_after numeric(14, 4);
begin
  select * into v_document
  from sales_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document not found.';
  end if;
  if v_document.document_type <> 'DELIVERY_NOTE' then
    raise exception 'Only delivery notes can change stock.';
  end if;
  if v_document.status = 'CONFIRMED' then
    raise exception 'Delivery note is already confirmed.';
  end if;
  if v_document.status = 'CANCELLED' then
    raise exception 'Cancelled delivery note cannot be confirmed.';
  end if;

  perform set_config('app.receipt_document_rpc', 'on', true);

  for v_line in
    select * from sales_document_lines where sales_document_id = p_document_id order by created_at for update
  loop
    select current_stock into v_current_stock
    from products
    where id = v_line.product_id
    for update;

    if coalesce(v_current_stock, 0) < v_line.quantity then
      raise exception 'Not enough stock for %. Current: %, requested: %.', v_line.article_code_snapshot, v_current_stock, v_line.quantity;
    end if;

    update products
    set current_stock = current_stock - v_line.quantity
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, sales_document_id, sales_document_line_id,
      reference_number, comment
    ) values (
      v_line.product_id, 'ISSUE', -v_line.quantity, v_stock_after,
      'SALES_DELIVERY_NOTE', null, p_document_id, v_line.id,
      v_document.document_number, 'Važtaraštis patvirtintas'
    );

    update stock_reservations
    set status = 'CONVERTED', released_at = now()
    where status = 'ACTIVE'
      and product_id = v_line.product_id
      and sales_document_id in (
        select source_document_id
        from document_relations
        where target_document_id = p_document_id
      );
  end loop;

  update sales_documents
  set status = 'CONFIRMED', confirmed_at = now()
  where id = p_document_id;
end;
$function$;

create or replace function cancel_delivery_note(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_document sales_documents%rowtype;
  v_line sales_document_lines%rowtype;
  v_stock_after numeric(14, 4);
begin
  select * into v_document
  from sales_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document not found.';
  end if;
  if v_document.document_type <> 'DELIVERY_NOTE' then
    raise exception 'Only delivery notes can be cancelled through this function.';
  end if;
  if v_document.status <> 'CONFIRMED' then
    raise exception 'Only confirmed delivery notes can be cancelled.';
  end if;

  perform set_config('app.receipt_document_rpc', 'on', true);

  for v_line in
    select * from sales_document_lines where sales_document_id = p_document_id order by created_at for update
  loop
    update products
    set current_stock = current_stock + v_line.quantity
    where id = v_line.product_id
    returning current_stock into v_stock_after;

    insert into stock_movements (
      product_id, movement_type, quantity_delta, stock_after_movement,
      reference_type, reference_id, sales_document_id, sales_document_line_id,
      reference_number, comment
    ) values (
      v_line.product_id, 'ISSUE_REVERSAL', v_line.quantity, v_stock_after,
      'SALES_DELIVERY_NOTE', null, p_document_id, v_line.id,
      v_document.document_number, 'Važtaraštis atšauktas'
    );
  end loop;

  update sales_documents
  set status = 'CANCELLED', cancelled_at = now()
  where id = p_document_id;
end;
$function$;

create or replace function register_payment(
  p_document_id uuid,
  p_payment_date date,
  p_amount numeric,
  p_payment_method text,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_document sales_documents%rowtype;
  v_paid numeric(14, 4);
  v_debt numeric(14, 4);
  v_new_paid numeric(14, 4);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be positive.';
  end if;

  select * into v_document
  from sales_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document not found.';
  end if;
  if v_document.status = 'CANCELLED' then
    raise exception 'Cancelled document cannot be paid.';
  end if;

  select coalesce(sum(amount), 0)
    into v_paid
  from payments
  where sales_document_id = p_document_id;

  v_debt := greatest(0, v_document.total - v_paid);
  if p_amount > v_debt then
    raise exception 'Payment amount exceeds remaining debt.';
  end if;

  insert into payments (
    sales_document_id, payment_date, amount, payment_method, notes, created_by
  ) values (
    p_document_id, coalesce(p_payment_date, current_date), p_amount, p_payment_method, p_notes, auth.uid()
  );

  v_new_paid := v_paid + p_amount;

  update sales_documents
  set paid_amount = v_new_paid,
      status = case
        when v_new_paid >= total then 'PAID'
        when v_new_paid > 0 then 'PARTIALLY_PAID'
        else status
      end
  where id = p_document_id;
end;
$function$;

alter table customers enable row level security;
alter table sales_documents enable row level security;
alter table sales_document_lines enable row level security;
alter table document_relations enable row level security;
alter table stock_reservations enable row level security;
alter table payments enable row level security;

drop policy if exists "authenticated_select_customers" on customers;
drop policy if exists "authenticated_insert_customers" on customers;
drop policy if exists "authenticated_update_customers" on customers;
drop policy if exists "authenticated_delete_customers" on customers;
create policy "authenticated_select_customers" on customers for select to authenticated using (true);
create policy "authenticated_insert_customers" on customers for insert to authenticated with check (true);
create policy "authenticated_update_customers" on customers for update to authenticated using (true) with check (true);
create policy "authenticated_delete_customers" on customers for delete to authenticated using (true);

drop policy if exists "authenticated_select_sales_documents" on sales_documents;
drop policy if exists "authenticated_insert_sales_documents" on sales_documents;
drop policy if exists "authenticated_update_sales_documents" on sales_documents;
drop policy if exists "authenticated_delete_draft_sales_documents" on sales_documents;
create policy "authenticated_select_sales_documents" on sales_documents for select to authenticated using (true);
create policy "authenticated_insert_sales_documents" on sales_documents for insert to authenticated with check (true);
create policy "authenticated_update_sales_documents" on sales_documents for update to authenticated using (true) with check (true);
create policy "authenticated_delete_draft_sales_documents" on sales_documents for delete to authenticated using (status = 'DRAFT');

drop policy if exists "authenticated_select_sales_lines" on sales_document_lines;
drop policy if exists "authenticated_insert_sales_lines" on sales_document_lines;
drop policy if exists "authenticated_update_sales_lines" on sales_document_lines;
drop policy if exists "authenticated_delete_sales_lines" on sales_document_lines;
create policy "authenticated_select_sales_lines" on sales_document_lines for select to authenticated using (true);
create policy "authenticated_insert_sales_lines" on sales_document_lines for insert to authenticated with check (exists (select 1 from sales_documents where sales_documents.id = sales_document_lines.sales_document_id and sales_documents.status = 'DRAFT'));
create policy "authenticated_update_sales_lines" on sales_document_lines for update to authenticated using (exists (select 1 from sales_documents where sales_documents.id = sales_document_lines.sales_document_id and sales_documents.status = 'DRAFT')) with check (exists (select 1 from sales_documents where sales_documents.id = sales_document_lines.sales_document_id and sales_documents.status = 'DRAFT'));
create policy "authenticated_delete_sales_lines" on sales_document_lines for delete to authenticated using (exists (select 1 from sales_documents where sales_documents.id = sales_document_lines.sales_document_id and sales_documents.status = 'DRAFT'));

drop policy if exists "authenticated_select_document_relations" on document_relations;
drop policy if exists "authenticated_insert_document_relations" on document_relations;
create policy "authenticated_select_document_relations" on document_relations for select to authenticated using (true);
create policy "authenticated_insert_document_relations" on document_relations for insert to authenticated with check (true);

drop policy if exists "authenticated_select_stock_reservations" on stock_reservations;
create policy "authenticated_select_stock_reservations" on stock_reservations for select to authenticated using (true);

drop policy if exists "authenticated_select_payments" on payments;
create policy "authenticated_select_payments" on payments for select to authenticated using (true);

grant usage on schema public to authenticated;
revoke all privileges on table customers from anon, public;
revoke all privileges on table sales_documents from anon, public;
revoke all privileges on table sales_document_lines from anon, public;
revoke all privileges on table document_relations from anon, public;
revoke all privileges on table stock_reservations from anon, public;
revoke all privileges on table payments from anon, public;

grant select, insert, update, delete on table customers to authenticated;
grant select, insert, update, delete on table sales_documents to authenticated;
grant select, insert, update, delete on table sales_document_lines to authenticated;
grant select, insert on table document_relations to authenticated;
grant select on table stock_reservations to authenticated;
grant select on table payments to authenticated;

revoke execute on function generate_sales_document_number(text, date) from public;
revoke execute on function confirm_delivery_note(uuid) from public;
revoke execute on function cancel_delivery_note(uuid) from public;
revoke execute on function create_stock_reservation(uuid) from public;
revoke execute on function cancel_stock_reservation(uuid) from public;
revoke execute on function register_payment(uuid, date, numeric, text, text) from public;

grant execute on function generate_sales_document_number(text, date) to authenticated;
grant execute on function confirm_delivery_note(uuid) to authenticated;
grant execute on function cancel_delivery_note(uuid) to authenticated;
grant execute on function create_stock_reservation(uuid) to authenticated;
grant execute on function cancel_stock_reservation(uuid) to authenticated;
grant execute on function register_payment(uuid, date, numeric, text, text) to authenticated;
