-- Development seed data. Run manually only in development.

insert into suppliers (id, company_name, company_code, email, phone, notes)
values
  ('00000000-0000-4000-8000-000000000001', 'UAB Baltijos santechnika', '304112786', 'uzsakymai@baltijos-santechnika.lt', '+370 5 210 4560', 'Testinis tiekėjas'),
  ('00000000-0000-4000-8000-000000000002', 'UAB Vonia Pro', '302654911', 'info@voniapro.lt', '+370 37 441 205', 'Testinis tiekėjas'),
  ('00000000-0000-4000-8000-000000000003', 'Nordic Bath Distribution', '409887221', 'sales@nordicbath.example', '+370 6 530 1188', 'Testinis tiekėjas'),
  ('00000000-0000-4000-8000-000000000004', 'UAB Keramikos linija', '305884716', 'sandelys@keramikoslinija.lt', '+370 5 272 0144', 'Testinis tiekėjas')
on conflict (id) do nothing;

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
  'Development seed juodraštis.',
  144.80,
  30.408,
  175.208
)
on conflict (id) do nothing;

insert into receipt_document_lines (
  id, receipt_document_id, product_id, article_code_snapshot, product_name_snapshot,
  unit_snapshot, quantity, unit_price, vat_rate, line_subtotal, line_vat, line_total
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'MIX-1001',
    'Praustuvo maišytuvas Nordic 120',
    'vnt.',
    2,
    72.40,
    21,
    144.80,
    30.408,
    175.208
  )
on conflict (id) do nothing;

insert into products (
  id, article_code, name, manufacturer, category, unit, purchase_price, sale_price,
  vat_rate, current_stock, minimum_stock, warehouse_location, notes
)
values
  ('10000000-0000-4000-8000-000000000001', 'MIX-1001', 'Praustuvo maišytuvas Nordic 120', 'Hansgrohe', 'Maišytuvai', 'vnt.', 72.40, 109.90, 21, 14, 3, 'Vilnius', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000002', 'BAT-2040', 'Akrilinė vonia Clara 170x75', 'Ravak', 'Vonios', 'vnt.', 245.00, 349.00, 21, 5, 2, 'Vilnius', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000003', 'CAB-3188', 'Pakabinama spintelė su praustuvu Lino 80', 'Jika', 'Baldai', 'kompl.', 168.70, 259.00, 21, 8, 2, 'Kaunas', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000004', 'SHW-4502', 'Dušo sistema Thermo Rain', 'Grohe', 'Dušo sistemos', 'kompl.', 139.50, 219.00, 21, 11, 2, 'Vilnius', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000005', 'TOI-7710', 'Pakabinamas klozetas Rimless Nova', 'Laufen', 'Klozetai', 'vnt.', 126.00, 199.00, 21, 7, 2, 'Klaipėda', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000006', 'ACC-9124', 'Rankšluosčių laikiklis Black Line', 'Bemeta', 'Aksesuarai', 'vnt.', 18.20, 34.90, 21, 24, 5, 'Kaunas', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000007', 'BAS-0288', 'Keraminis praustuvas Oval 60', 'Ideal Standard', 'Praustuvai', 'vnt.', 58.00, 95.00, 21, 13, 3, 'Vilnius', 'Testinė prekė'),
  ('10000000-0000-4000-8000-000000000008', 'MIR-6044', 'Veidrodis su LED apšvietimu 90', 'Elita', 'Veidrodžiai', 'vnt.', 84.60, 139.00, 21, 4, 2, 'Klaipėda', 'Testinė prekė')
on conflict (id) do nothing;
