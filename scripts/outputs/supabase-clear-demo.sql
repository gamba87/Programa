-- Development helper. Removes demo receipt data, products and suppliers.
-- Do not run in production unless you really want to clear these tables.

truncate table
  stock_movements,
  receipt_document_lines,
  receipt_documents,
  products,
  suppliers
restart identity cascade;
