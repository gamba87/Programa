from __future__ import annotations

import unittest

from backend.accounting_engine import build_isaf_xml, build_report
from backend.http_handlers import JsonEndpoint
from backend.server import AccountingHandler
from api.accounting.report import handler as accounting_report_handler
from api.health import handler as health_handler
from api.isaf.xml import handler as isaf_xml_handler


def sample_payload():
    return {
        "accountingSettings": {
            "companyName": "UAB Programa",
            "companyCode": "305000000",
            "vatCode": "LT100000000000",
            "address": "Vilnius",
            "softwareName": "Programa",
            "softwareVersion": "1.0",
        },
        "suppliers": [
            {
                "id": "supplier-1",
                "name": "UAB Tiekejas",
                "code": "304111111",
                "vatCode": "LT100111111111",
            }
        ],
        "customers": [
            {
                "id": "customer-1",
                "name": "UAB Klientas",
                "companyCode": "302222222",
                "vatCode": "LT100222222222",
            }
        ],
        "products": [
            {
                "id": "product-1",
                "article": "A-1",
                "name": "Preke",
                "cost": 50,
            }
        ],
        "documents": [
            {
                "id": "receipt-1",
                "number": "PJD-2026-05-001",
                "supplierId": "supplier-1",
                "supplierDocumentNumber": "SUP-001",
                "date": "2026-05-05",
                "status": "Patvirtintas",
                "lines": [{"productId": "product-1", "quantity": 2, "unitPrice": 50}],
            }
        ],
        "salesDocuments": [
            {
                "id": "invoice-1",
                "type": "INVOICE",
                "number": "SF-2026-05-001",
                "customerId": "customer-1",
                "date": "2026-05-09",
                "status": "CONFIRMED",
                "lines": [{"productId": "product-1", "article": "A-1", "quantity": 2, "unitPrice": 100, "vatRate": 21}],
                "payments": [{"id": "payment-1", "paymentDate": "2026-05-10", "amount": 121, "method": "BANK_TRANSFER"}],
            },
            {
                "id": "delivery-1",
                "type": "DELIVERY_NOTE",
                "number": "VAZ-2026-05-001",
                "customerId": "customer-1",
                "date": "2026-05-09",
                "status": "CONFIRMED",
                "lines": [{"productId": "product-1", "article": "A-1", "quantity": 2}],
            },
        ],
    }


class AccountingEngineTest(unittest.TestCase):
    def test_build_report_balances_journal(self):
        report = build_report(sample_payload(), {"from": "2026-05-01", "to": "2026-05-31"}, today="2026-06-01")

        self.assertEqual(report["journalTotals"]["debit"], report["journalTotals"]["credit"])
        self.assertEqual(report["summary"]["revenue"], 200)
        self.assertEqual(report["summary"]["costOfGoods"], 100)
        self.assertEqual(report["summary"]["payableVat"], 21)
        self.assertTrue(report["isafReadiness"]["ready"])
        self.assertEqual(report["isafReadiness"]["deadline"], "2026-06-20")

    def test_account_filter_keeps_single_account_lines(self):
        report = build_report(sample_payload(), {"from": "2026-05-01", "to": "2026-05-31", "account": "5000"})

        self.assertTrue(report["journalLines"])
        self.assertTrue(all(line["accountCode"] == "5000" for line in report["journalLines"]))

    def test_isaf_xml_contains_invoice_sections(self):
        xml = build_isaf_xml(sample_payload(), {"from": "2026-05-01", "to": "2026-05-31"})

        self.assertIn("<SalesInvoices>", xml)
        self.assertIn("<PurchaseInvoices>", xml)
        self.assertIn("SF-2026-05-001", xml)
        self.assertIn("SUP-001", xml)

    def test_vercel_python_handlers_are_importable(self):
        self.assertTrue(hasattr(health_handler, "do_GET"))
        self.assertTrue(hasattr(accounting_report_handler, "do_POST"))
        self.assertTrue(hasattr(isaf_xml_handler, "do_POST"))
        self.assertTrue(issubclass(AccountingHandler, JsonEndpoint))


if __name__ == "__main__":
    unittest.main()
