-- Fix permissions for the sales module tables after creating the tables manually.
-- Run this in Supabase SQL Editor if the app shows:
-- permission denied for table customers

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
create policy "authenticated_insert_sales_lines" on sales_document_lines for insert to authenticated with check (
  exists (
    select 1
    from sales_documents
    where sales_documents.id = sales_document_lines.sales_document_id
      and sales_documents.status = 'DRAFT'
  )
);
create policy "authenticated_update_sales_lines" on sales_document_lines for update to authenticated using (
  exists (
    select 1
    from sales_documents
    where sales_documents.id = sales_document_lines.sales_document_id
      and sales_documents.status = 'DRAFT'
  )
) with check (
  exists (
    select 1
    from sales_documents
    where sales_documents.id = sales_document_lines.sales_document_id
      and sales_documents.status = 'DRAFT'
  )
);
create policy "authenticated_delete_sales_lines" on sales_document_lines for delete to authenticated using (
  exists (
    select 1
    from sales_documents
    where sales_documents.id = sales_document_lines.sales_document_id
      and sales_documents.status = 'DRAFT'
  )
);

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
