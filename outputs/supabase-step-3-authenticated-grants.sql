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

revoke execute on function confirm_receipt_document(uuid) from anon;
revoke execute on function cancel_receipt_document(uuid) from anon;
revoke execute on function delete_draft_receipt_document(uuid) from anon;
revoke execute on function confirm_receipt_document(uuid) from public;
revoke execute on function cancel_receipt_document(uuid) from public;
revoke execute on function delete_draft_receipt_document(uuid) from public;
grant execute on function confirm_receipt_document(uuid) to authenticated;
grant execute on function cancel_receipt_document(uuid) to authenticated;
grant execute on function delete_draft_receipt_document(uuid) to authenticated;

alter table products enable row level security;
alter table suppliers enable row level security;
alter table receipt_documents enable row level security;
alter table receipt_document_lines enable row level security;
alter table stock_movements enable row level security;
