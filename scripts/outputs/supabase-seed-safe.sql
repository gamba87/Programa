insert into suppliers (id, company_name, company_code, email, phone, notes)
values
  ('00000000-0000-4000-8000-000000000001', 'UAB Baltijos santechnika', '304112786', 'uzsakymai@baltijos-santechnika.lt', '+370 5 210 4560', 'Testinis tiekejas'),
  ('00000000-0000-4000-8000-000000000002', 'UAB Vonia Pro', '302654911', 'info@voniapro.lt', '+370 37 441 205', 'Testinis tiekejas'),
  ('00000000-0000-4000-8000-000000000003', 'Nordic Bath Distribution', '409887221', 'sales@nordicbath.example', '+370 6 530 1188', 'Testinis tiekejas'),
  ('00000000-0000-4000-8000-000000000004', 'UAB Keramikos linija', '305884716', 'sandelys@keramikoslinija.lt', '+370 5 272 0144', 'Testinis tiekejas')
on conflict (id) do update
set company_name = excluded.company_name,
    company_code = excluded.company_code,
    email = excluded.email,
    phone = excluded.phone,
    notes = excluded.notes;

insert into products (
  id, article_code, name, manufacturer, category, unit, purchase_price, sale_price,
  vat_rate, current_stock, minimum_stock, warehouse_location, notes
)
values
  ('10000000-0000-4000-8000-000000000001', 'MIX-1001', 'Praustuvo maisytuvas Nordic 120', 'Hansgrohe', 'Maisytuvai', 'vnt.', 72.40, 109.90, 21, 14, 3, 'Vilnius', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000002', 'BAT-2040', 'Akriline vonia Clara 170x75', 'Ravak', 'Vonios', 'vnt.', 245.00, 349.00, 21, 5, 2, 'Vilnius', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000003', 'CAB-3188', 'Pakabinama spintele su praustuvu Lino 80', 'Jika', 'Baldai', 'kompl.', 168.70, 259.00, 21, 8, 2, 'Kaunas', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000004', 'SHW-4502', 'Duso sistema Thermo Rain', 'Grohe', 'Duso sistemos', 'kompl.', 139.50, 219.00, 21, 11, 2, 'Vilnius', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000005', 'TOI-7710', 'Pakabinamas klozetas Rimless Nova', 'Laufen', 'Klozetai', 'vnt.', 126.00, 199.00, 21, 7, 2, 'Klaipeda', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000006', 'ACC-9124', 'Ranksluosciu laikiklis Black Line', 'Bemeta', 'Aksesuarai', 'vnt.', 18.20, 34.90, 21, 24, 5, 'Kaunas', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000007', 'BAS-0288', 'Keraminis praustuvas Oval 60', 'Ideal Standard', 'Praustuvai', 'vnt.', 58.00, 95.00, 21, 13, 3, 'Vilnius', 'Testine preke'),
  ('10000000-0000-4000-8000-000000000008', 'MIR-6044', 'Veidrodis su LED apsvietimu 90', 'Elita', 'Veidrodziai', 'vnt.', 84.60, 139.00, 21, 4, 2, 'Klaipeda', 'Testine preke')
on conflict (article_code) do update
set name = excluded.name,
    manufacturer = excluded.manufacturer,
    category = excluded.category,
    unit = excluded.unit,
    purchase_price = excluded.purchase_price,
    sale_price = excluded.sale_price,
    vat_rate = excluded.vat_rate,
    current_stock = excluded.current_stock,
    minimum_stock = excluded.minimum_stock,
    warehouse_location = excluded.warehouse_location,
    notes = excluded.notes;

insert into receipt_documents (
  id, document_number, supplier_id, supplier_document_number, document_date,
  status, notes, subtotal, vat_total, total
)
values (
  '20000000-0000-4000-8000-000000000001',
  'PJD-2026-06-001',
  '00000000-0000-4000-8000-000000000001',
  'BS-DEMO-001',
  '2026-06-02',
  'DRAFT',
  'Testinis juodrastis.',
  144.80,
  30.408,
  175.208
)
on conflict (id) do update
set document_number = excluded.document_number,
    supplier_id = excluded.supplier_id,
    supplier_document_number = excluded.supplier_document_number,
    document_date = excluded.document_date,
    status = excluded.status,
    notes = excluded.notes,
    subtotal = excluded.subtotal,
    vat_total = excluded.vat_total,
    total = excluded.total;

insert into receipt_document_lines (
  id, receipt_document_id, product_id, article_code_snapshot, product_name_snapshot,
  unit_snapshot, quantity, unit_price, vat_rate, line_subtotal, line_vat, line_total
)
select
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  products.id,
  products.article_code,
  products.name,
  products.unit,
  2,
  72.40,
  21,
  144.80,
  30.408,
  175.208
from products
where products.article_code = 'MIX-1001'
on conflict (id) do update
set product_id = excluded.product_id,
    article_code_snapshot = excluded.article_code_snapshot,
    product_name_snapshot = excluded.product_name_snapshot,
    unit_snapshot = excluded.unit_snapshot,
    quantity = excluded.quantity,
    unit_price = excluded.unit_price,
    vat_rate = excluded.vat_rate,
    line_subtotal = excluded.line_subtotal,
    line_vat = excluded.line_vat,
    line_total = excluded.line_total;
