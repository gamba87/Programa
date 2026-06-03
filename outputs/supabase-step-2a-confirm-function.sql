create or replace function confirm_receipt_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
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
    raise exception 'Document not found.';
  end if;

  if v_document.status <> 'DRAFT' then
    raise exception 'Only draft documents can be confirmed.';
  end if;

  update receipt_documents
  set status = 'CONFIRMED', confirmed_at = now(), cancelled_at = null, updated_at = now()
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
      v_line.product_id, 'RECEIPT_CONFIRM', v_line.quantity, v_stock_after,
      'RECEIPT_DOCUMENT', p_document_id, v_line.id, 'Receipt document confirmed'
    );
  end loop;
end;
$function$;

revoke execute on function confirm_receipt_document(uuid) from public;
grant execute on function confirm_receipt_document(uuid) to authenticated;
