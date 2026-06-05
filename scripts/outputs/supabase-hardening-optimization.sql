-- Supabase hardening and optimization patch for the inventory app.
-- Already applied to project npsmcpjnxuvhayyohoul on 2026-06-05.

create index if not exists idx_receipt_document_lines_product_id
  on public.receipt_document_lines(product_id);

create index if not exists idx_receipt_document_lines_receipt_document_id
  on public.receipt_document_lines(receipt_document_id);

create index if not exists idx_stock_movements_reference_line_id
  on public.stock_movements(reference_line_id);

create index if not exists idx_stock_movements_sales_document_id
  on public.stock_movements(sales_document_id);

create index if not exists idx_stock_movements_sales_document_line_id
  on public.stock_movements(sales_document_line_id);

create index if not exists idx_stock_reservations_sales_document_id
  on public.stock_reservations(sales_document_id);

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.assign_sales_document_number() set search_path = public, pg_temp;
alter function public.set_sales_line_totals() set search_path = public, pg_temp;
alter function public.refresh_sales_document_totals_trigger() set search_path = public, pg_temp;
alter function public.confirm_receipt_document(uuid) set search_path = public, pg_temp;
alter function public.cancel_receipt_document(uuid) set search_path = public, pg_temp;
alter function public.delete_draft_receipt_document(uuid) set search_path = public, pg_temp;
alter function public.confirm_delivery_note(uuid) set search_path = public, pg_temp;
alter function public.cancel_delivery_note(uuid) set search_path = public, pg_temp;
alter function public.create_stock_reservation(uuid) set search_path = public, pg_temp;
alter function public.cancel_stock_reservation(uuid) set search_path = public, pg_temp;
alter function public.generate_sales_document_number(text, date) set search_path = public, pg_temp;
alter function public.register_payment(uuid, date, numeric, text, text) set search_path = public, pg_temp;
alter function public.recalculate_sales_document_totals(uuid) set search_path = public, pg_temp;

revoke execute on function public.recalculate_sales_document_totals(uuid) from anon;
revoke execute on function public.recalculate_sales_document_totals(uuid) from public;
grant execute on function public.recalculate_sales_document_totals(uuid) to authenticated;

drop policy if exists authenticated_select_products on public.products;
drop policy if exists authenticated_insert_products on public.products;
drop policy if exists authenticated_update_products on public.products;
drop policy if exists authenticated_delete_products on public.products;
create policy authenticated_select_products on public.products
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy authenticated_insert_products on public.products
  for insert to authenticated with check ((select auth.role()) = 'authenticated');
create policy authenticated_update_products on public.products
  for update to authenticated using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');
create policy authenticated_delete_products on public.products
  for delete to authenticated using ((select auth.role()) = 'authenticated');

drop policy if exists authenticated_select_suppliers on public.suppliers;
drop policy if exists authenticated_insert_suppliers on public.suppliers;
drop policy if exists authenticated_update_suppliers on public.suppliers;
drop policy if exists authenticated_delete_suppliers on public.suppliers;
create policy authenticated_select_suppliers on public.suppliers
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy authenticated_insert_suppliers on public.suppliers
  for insert to authenticated with check ((select auth.role()) = 'authenticated');
create policy authenticated_update_suppliers on public.suppliers
  for update to authenticated using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');
create policy authenticated_delete_suppliers on public.suppliers
  for delete to authenticated using ((select auth.role()) = 'authenticated');

drop policy if exists authenticated_select_customers on public.customers;
drop policy if exists authenticated_insert_customers on public.customers;
drop policy if exists authenticated_update_customers on public.customers;
drop policy if exists authenticated_delete_customers on public.customers;
create policy authenticated_select_customers on public.customers
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy authenticated_insert_customers on public.customers
  for insert to authenticated with check ((select auth.role()) = 'authenticated');
create policy authenticated_update_customers on public.customers
  for update to authenticated using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');
create policy authenticated_delete_customers on public.customers
  for delete to authenticated using ((select auth.role()) = 'authenticated');

drop policy if exists authenticated_select_sales_documents on public.sales_documents;
drop policy if exists authenticated_insert_sales_documents on public.sales_documents;
drop policy if exists authenticated_update_sales_documents on public.sales_documents;
create policy authenticated_select_sales_documents on public.sales_documents
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy authenticated_insert_sales_documents on public.sales_documents
  for insert to authenticated with check ((select auth.role()) = 'authenticated');
create policy authenticated_update_sales_documents on public.sales_documents
  for update to authenticated using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');

drop policy if exists authenticated_select_document_relations on public.document_relations;
drop policy if exists authenticated_insert_document_relations on public.document_relations;
create policy authenticated_select_document_relations on public.document_relations
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy authenticated_insert_document_relations on public.document_relations
  for insert to authenticated with check ((select auth.role()) = 'authenticated');

drop policy if exists "Authenticated users can read accounting settings" on public.accounting_settings;
drop policy if exists "Authenticated users can insert accounting settings" on public.accounting_settings;
drop policy if exists "Authenticated users can update accounting settings" on public.accounting_settings;
create policy "Authenticated users can read accounting settings" on public.accounting_settings
  for select to authenticated using ((select auth.role()) = 'authenticated');
create policy "Authenticated users can insert accounting settings" on public.accounting_settings
  for insert to authenticated with check (((select auth.role()) = 'authenticated') and id = 'main');
create policy "Authenticated users can update accounting settings" on public.accounting_settings
  for update to authenticated using (((select auth.role()) = 'authenticated') and id = 'main')
  with check (((select auth.role()) = 'authenticated') and id = 'main');

revoke insert, update, delete, truncate on table public.stock_movements from anon, authenticated;
grant select on table public.stock_movements to authenticated;
revoke all on table public.stock_movements from anon;
