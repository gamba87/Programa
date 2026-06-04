create or replace function delete_draft_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_status text;
begin
  select status into v_status
  from receipt_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'Document not found.';
  end if;

  if v_status <> 'DRAFT' then
    raise exception 'Only draft documents can be deleted.';
  end if;

  delete from receipt_documents where id = p_document_id;
end;
$function$;

revoke execute on function delete_draft_receipt_document(uuid) from public;
grant execute on function delete_draft_receipt_document(uuid) to authenticated;
