"""Accounting, VAT, and i.SAF reporting engine for Programa.

The module is intentionally dependency-free so it can run in the bundled
Codex Python runtime, on a user's workstation, or behind a later FastAPI app.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from html import escape
from typing import Any


VAT_RATE = 0.21
ISAF_MONTHLY_DEADLINE_DAY = 20

ACCOUNTS = [
    {"code": "2010", "name": "Prekiu atsargos", "type": "Turtas"},
    {"code": "2410", "name": "Pirkeju skolos", "type": "Turtas"},
    {"code": "2431", "name": "Gautinas PVM", "type": "Turtas"},
    {"code": "2710", "name": "Banko saskaita", "type": "Turtas"},
    {"code": "2720", "name": "Kasa", "type": "Turtas"},
    {"code": "4430", "name": "Skolos tiekejams", "type": "Isipareigojimai"},
    {"code": "4484", "name": "Moketinas PVM", "type": "Isipareigojimai"},
    {"code": "5000", "name": "Pardavimo pajamos", "type": "Pajamos"},
    {"code": "6000", "name": "Parduotu prekiu savikaina", "type": "Sanaudos"},
]

ACCOUNT_BY_CODE = {account["code"]: account for account in ACCOUNTS}
SALES_TYPES = {
    "PREPAYMENT_INVOICE": "Isankstine saskaita",
    "INVOICE": "Saskaita faktura",
    "DELIVERY_NOTE": "Vaztarastis",
}
PAYMENT_METHODS = {
    "BANK_TRANSFER": "Banko pavedimas",
    "CASH": "Grynieji",
    "CARD": "Kortele",
    "OTHER": "Kita",
}


@dataclass(frozen=True)
class ReportFilters:
    date_from: str = ""
    date_to: str = ""
    account: str = "ALL"
    source: str = "ALL"
    register: str = "ALL"

    @classmethod
    def from_payload(cls, value: dict[str, Any] | None) -> "ReportFilters":
        data = value or {}
        return cls(
            date_from=str(data.get("from") or data.get("dateFrom") or ""),
            date_to=str(data.get("to") or data.get("dateTo") or ""),
            account=str(data.get("account") or "ALL"),
            source=str(data.get("source") or "ALL"),
            register=str(data.get("register") or "ALL"),
        )


def build_report(payload: dict[str, Any], filters: dict[str, Any] | None = None, today: str | None = None) -> dict[str, Any]:
    """Build a complete accounting report from app-shaped JSON."""
    report_filters = ReportFilters.from_payload(filters)
    entries = filtered_journal_entries(payload, report_filters)
    lines = sorted(
        [line for entry in entries for line in entry["lines"]],
        key=lambda line: (line["date"], line["documentNumber"], line["lineId"]),
        reverse=True,
    )
    totals = line_totals(lines)
    vat_entries = filtered_vat_entries(payload, report_filters)
    trial_balance = build_trial_balance(lines, report_filters)
    summary = build_summary(payload, entries, lines, vat_entries, report_filters)
    readiness = build_isaf_readiness(payload, report_filters, today=today)

    return {
        "accounts": ACCOUNTS,
        "filters": report_filters.__dict__,
        "summary": summary,
        "journalEntries": entries,
        "journalLines": lines,
        "journalTotals": totals,
        "trialBalance": trial_balance,
        "vatEntries": vat_entries,
        "vatTotals": vat_totals(vat_entries),
        "isafReadiness": readiness,
    }


def journal_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    entries = [
        *purchase_entries(payload),
        *sales_entries(payload),
        *payment_entries(payload),
        *delivery_cost_entries(payload),
    ]
    return sorted(
        [entry for entry in entries if entry["lines"]],
        key=lambda entry: (entry["date"], entry["documentNumber"], entry["id"]),
        reverse=True,
    )


def filtered_journal_entries(payload: dict[str, Any], filters: ReportFilters) -> list[dict[str, Any]]:
    entries = []
    for entry in journal_entries(payload):
        if not date_matches(entry["date"], filters.date_from, filters.date_to):
            continue
        if filters.source != "ALL" and entry["source"] != filters.source:
            continue
        lines = [line for line in entry["lines"] if filters.account == "ALL" or line["accountCode"] == filters.account]
        if lines:
            entries.append({**entry, "lines": lines})
    return entries


def purchase_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    suppliers = by_id(payload.get("suppliers", []))
    entries = []
    for document in payload.get("documents", []):
        if not is_confirmed_receipt(document):
            continue
        totals = receipt_totals(document)
        supplier = suppliers.get(str(document.get("supplierId")), {})
        number = document.get("supplierDocumentNumber") or document.get("number") or ""
        entries.append(
            make_entry(
                entry_id=f"purchase-{document.get('id')}",
                source="purchase",
                source_label="Pirkimas",
                entry_date=document.get("date", ""),
                document_id=document.get("id"),
                document_number=number,
                internal_number=document.get("number", ""),
                party_name=supplier.get("name", ""),
                lines=[
                    line("2010", totals["subtotal"], 0, "Prekes pajamuotos i atsargas"),
                    line("2431", totals["vat"], 0, "Pirkimo PVM"),
                    line("4430", 0, totals["total"], "Skola tiekejui"),
                ],
            )
        )
    return entries


def sales_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    customers = by_id(payload.get("customers", []))
    entries = []
    for document in payload.get("salesDocuments", []):
        if document.get("type") not in {"PREPAYMENT_INVOICE", "INVOICE"} or is_cancelled_or_draft(document):
            continue
        totals = sales_totals(document)
        customer = customers.get(str(document.get("customerId")), {})
        entries.append(
            make_entry(
                entry_id=f"sales-{document.get('id')}",
                source="sales",
                source_label=SALES_TYPES.get(document.get("type"), str(document.get("type", ""))),
                entry_date=document.get("date", ""),
                document_id=document.get("id"),
                document_number=document.get("number", ""),
                internal_number=document.get("customerDocumentNumber", ""),
                party_name=customer.get("name", ""),
                lines=[
                    line("2410", totals["total"], 0, "Pirkejo skola"),
                    line("5000", 0, totals["subtotal"], "Pardavimo pajamos"),
                    line("4484", 0, totals["vat"], "Pardavimo PVM"),
                ],
            )
        )
    return entries


def payment_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    customers = by_id(payload.get("customers", []))
    entries = []
    for document in payload.get("salesDocuments", []):
        customer = customers.get(str(document.get("customerId")), {})
        for payment in document.get("payments", []) or []:
            amount = money(payment.get("amount"))
            cash_account = "2720" if payment.get("method") == "CASH" else "2710"
            entries.append(
                make_entry(
                    entry_id=f"payment-{payment.get('id') or document.get('id')}",
                    source="payment",
                    source_label="Mokejimas",
                    entry_date=payment.get("paymentDate", ""),
                    document_id=document.get("id"),
                    document_number=document.get("number", ""),
                    internal_number="",
                    party_name=customer.get("name", ""),
                    lines=[
                        line(cash_account, amount, 0, PAYMENT_METHODS.get(payment.get("method"), "Kliento mokejimas")),
                        line("2410", 0, amount, "Skolos dengimas"),
                    ],
                )
            )
    return entries


def delivery_cost_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    customers = by_id(payload.get("customers", []))
    entries = []
    for document in payload.get("salesDocuments", []):
        if document.get("type") != "DELIVERY_NOTE" or str(document.get("status")) != "CONFIRMED":
            continue
        cost = delivery_cost(document, payload.get("products", []))
        customer = customers.get(str(document.get("customerId")), {})
        entries.append(
            make_entry(
                entry_id=f"delivery-{document.get('id')}",
                source="delivery",
                source_label="Savikaina",
                entry_date=document.get("date", ""),
                document_id=document.get("id"),
                document_number=document.get("number", ""),
                internal_number=document.get("customerDocumentNumber", ""),
                party_name=customer.get("name", ""),
                lines=[
                    line("6000", cost, 0, "Parduotu prekiu savikaina"),
                    line("2010", 0, cost, "Atsargu nurasymas"),
                ],
            )
        )
    return entries


def make_entry(
    *,
    entry_id: str,
    source: str,
    source_label: str,
    entry_date: str,
    document_id: Any,
    document_number: str,
    internal_number: str,
    party_name: str,
    lines: list[dict[str, Any]],
) -> dict[str, Any]:
    clean_lines = []
    for index, item in enumerate(lines, start=1):
        if not item["debit"] and not item["credit"]:
            continue
        clean_lines.append(
            {
                **item,
                "entryId": entry_id,
                "lineId": f"{entry_id}-{index}",
                "date": entry_date,
                "source": source,
                "sourceLabel": source_label,
                "documentId": document_id,
                "documentNumber": document_number,
                "internalNumber": internal_number,
                "partyName": party_name,
            }
        )
    return {
        "id": entry_id,
        "source": source,
        "sourceLabel": source_label,
        "date": entry_date,
        "documentId": document_id,
        "documentNumber": document_number,
        "internalNumber": internal_number,
        "partyName": party_name,
        "lines": clean_lines,
    }


def line(account_code: str, debit: Any = 0, credit: Any = 0, note: str = "") -> dict[str, Any]:
    account = ACCOUNT_BY_CODE.get(account_code, {})
    return {
        "accountCode": account_code,
        "accountName": account.get("name", ""),
        "accountType": account.get("type", ""),
        "debit": money(debit),
        "credit": money(credit),
        "note": note,
    }


def build_trial_balance(lines: list[dict[str, Any]], filters: ReportFilters) -> list[dict[str, Any]]:
    rows = {
        account["code"]: {
            "code": account["code"],
            "name": account["name"],
            "type": account["type"],
            "debit": 0.0,
            "credit": 0.0,
        }
        for account in ACCOUNTS
    }
    for item in lines:
        row = rows.get(item["accountCode"])
        if not row:
            continue
        row["debit"] = money(row["debit"] + item["debit"])
        row["credit"] = money(row["credit"] + item["credit"])

    result = []
    for row in rows.values():
        if filters.account != "ALL" and row["code"] != filters.account:
            continue
        if row["debit"] or row["credit"]:
            balance = money(row["debit"] - row["credit"])
            result.append(
                {
                    **row,
                    "balance": abs(balance),
                    "direction": "-" if abs(balance) < 0.005 else ("Debetas" if balance > 0 else "Kreditas"),
                }
            )
    return result


def vat_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    customers = by_id(payload.get("customers", []))
    suppliers = by_id(payload.get("suppliers", []))
    entries = []
    for document in payload.get("salesDocuments", []):
        if document.get("type") not in {"PREPAYMENT_INVOICE", "INVOICE"} or is_cancelled_or_draft(document):
            continue
        totals = sales_totals(document)
        customer = customers.get(str(document.get("customerId")), {})
        entries.append(
            {
                "register": "sales",
                "date": document.get("date", ""),
                "number": document.get("number", ""),
                "internalNumber": document.get("number", ""),
                "partyName": customer.get("name", ""),
                "partyCode": customer.get("companyCode", ""),
                "partyVatCode": customer.get("vatCode", ""),
                "subtotal": totals["subtotal"],
                "vat": totals["vat"],
                "total": totals["total"],
                "status": document.get("status", ""),
                "sourceLabel": SALES_TYPES.get(document.get("type"), str(document.get("type", ""))),
                "documentId": document.get("id"),
            }
        )
    for document in payload.get("documents", []):
        if not is_confirmed_receipt(document):
            continue
        totals = receipt_totals(document)
        supplier = suppliers.get(str(document.get("supplierId")), {})
        entries.append(
            {
                "register": "purchase",
                "date": document.get("date", ""),
                "number": document.get("supplierDocumentNumber") or document.get("number", ""),
                "internalNumber": document.get("number", ""),
                "partyName": supplier.get("name", ""),
                "partyCode": supplier.get("code", ""),
                "partyVatCode": supplier.get("vatCode", ""),
                "subtotal": totals["subtotal"],
                "vat": totals["vat"],
                "total": totals["total"],
                "status": document.get("status", ""),
                "sourceLabel": "Pajamavimas",
                "documentId": document.get("id"),
            }
        )
    return sorted(entries, key=lambda entry: (entry["date"], entry["number"]), reverse=True)


def filtered_vat_entries(payload: dict[str, Any], filters: ReportFilters) -> list[dict[str, Any]]:
    return [
        entry
        for entry in vat_entries(payload)
        if date_matches(entry["date"], filters.date_from, filters.date_to)
        and (filters.register == "ALL" or entry["register"] == filters.register)
    ]


def build_summary(
    payload: dict[str, Any],
    entries: list[dict[str, Any]],
    lines: list[dict[str, Any]],
    filtered_vat: list[dict[str, Any]],
    filters: ReportFilters,
) -> dict[str, Any]:
    totals = line_totals(lines)
    output_vat = sum(item["vat"] for item in filtered_vat if item["register"] == "sales")
    input_vat = sum(item["vat"] for item in filtered_vat if item["register"] == "purchase")
    revenue = account_credit(lines, "5000")
    cost = account_debit(lines, "6000")
    customer_debt = customer_debt_total(payload)
    purchase_total = sum(receipt_totals(item)["total"] for item in payload.get("documents", []) if is_confirmed_receipt(item) and date_matches(item.get("date", ""), filters.date_from, filters.date_to))

    return {
        "entryCount": len(entries),
        "lineCount": len(lines),
        "debit": totals["debit"],
        "credit": totals["credit"],
        "debitCreditDifference": money(abs(totals["debit"] - totals["credit"])),
        "revenue": revenue,
        "costOfGoods": cost,
        "grossProfit": money(revenue - cost),
        "paymentsReceived": sum(item["debit"] for item in lines if item["accountCode"] in {"2710", "2720"}),
        "purchaseTotal": money(purchase_total),
        "customerDebt": customer_debt,
        "outputVat": money(output_vat),
        "inputVat": money(input_vat),
        "payableVat": money(output_vat - input_vat),
    }


def build_isaf_readiness(payload: dict[str, Any], filters: ReportFilters, today: str | None = None) -> dict[str, Any]:
    entries = filtered_vat_entries(payload, filters)
    missing_settings = missing_isaf_settings(payload.get("accountingSettings", {}))
    entry_issues = []
    for entry in entries:
        entry_issues.extend(isaf_entry_issues(entry))
    entry_issues.extend(duplicate_invoice_issues(entries))
    deadline = isaf_deadline(filters.date_to or filters.date_from or today_iso())
    today_value = today or today_iso()
    days_left = (parse_date(deadline) - parse_date(today_value)).days

    return {
        "entryCount": len(entries),
        "salesCount": len([item for item in entries if item["register"] == "sales"]),
        "purchaseCount": len([item for item in entries if item["register"] == "purchase"]),
        "missingSettings": missing_settings,
        "entryIssues": entry_issues,
        "deadline": deadline,
        "daysLeft": days_left,
        "hasNoInvoices": len(entries) == 0,
        "ready": not missing_settings and not entry_issues,
    }


def isaf_entry_issues(entry: dict[str, Any]) -> list[str]:
    prefix = f"{'Israsoma' if entry['register'] == 'sales' else 'Gaunama'} {entry.get('number') or '(be numerio)'}"
    issues = []
    for value, label in [
        (entry.get("date"), "data"),
        (entry.get("number"), "dokumento Nr."),
        (entry.get("partyName"), "partneris"),
        (entry.get("partyCode"), "partnerio kodas"),
        (entry.get("partyVatCode"), "partnerio PVM kodas"),
    ]:
        if not str(value or "").strip():
            issues.append(f"{prefix}: {label}")
    if entry.get("total", 0) <= 0 and entry.get("subtotal", 0) <= 0 and entry.get("vat", 0) <= 0:
        issues.append(f"{prefix}: sumos")
    return issues


def duplicate_invoice_issues(entries: list[dict[str, Any]]) -> list[str]:
    seen: dict[tuple[str, str, str, str], str] = {}
    issues = []
    for entry in entries:
        key = (
            entry["register"],
            str(entry.get("partyVatCode", "")).strip().upper(),
            str(entry.get("date", "")).strip(),
            normalize_invoice_number(entry.get("number", "")),
        )
        if not all(key[1:]):
            continue
        previous = seen.get(key)
        if previous:
            issues.append(f"Galimas dublikatas: {previous} ir {entry.get('number')}")
        else:
            seen[key] = str(entry.get("number", ""))
    return issues


def build_isaf_xml(payload: dict[str, Any], filters: dict[str, Any] | None = None) -> str:
    report_filters = ReportFilters.from_payload(filters)
    settings = payload.get("accountingSettings", {})
    entries = filtered_vat_entries(payload, report_filters)
    sales_entries = [entry for entry in entries if entry["register"] == "sales"]
    purchase_entries = [entry for entry in entries if entry["register"] == "purchase"]
    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            "<iSAFFile>",
            "  <Header>",
            "    <FileDescription>i.SAF PVM saskaitu fakturu registru rinkmena</FileDescription>",
            "    <FileVersion>1.0</FileVersion>",
            f"    <CompanyName>{xml(settings.get('companyName', ''))}</CompanyName>",
            f"    <CompanyCode>{xml(settings.get('companyCode', ''))}</CompanyCode>",
            f"    <TaxRegistrationNumber>{xml(settings.get('vatCode', ''))}</TaxRegistrationNumber>",
            f"    <Address>{xml(settings.get('address', ''))}</Address>",
            f"    <PeriodStart>{xml(report_filters.date_from)}</PeriodStart>",
            f"    <PeriodEnd>{xml(report_filters.date_to)}</PeriodEnd>",
            "    <CurrencyCode>EUR</CurrencyCode>",
            f"    <SoftwareName>{xml(settings.get('softwareName', 'Programa'))}</SoftwareName>",
            f"    <SoftwareVersion>{xml(settings.get('softwareVersion', '1.0'))}</SoftwareVersion>",
            f"    <GeneratedAt>{xml(datetime.now(UTC).isoformat(timespec='seconds'))}</GeneratedAt>",
            "  </Header>",
            "  <SalesInvoices>",
            *[render_invoice_xml(entry, index) for index, entry in enumerate(sales_entries, start=1)],
            "  </SalesInvoices>",
            "  <PurchaseInvoices>",
            *[render_invoice_xml(entry, index) for index, entry in enumerate(purchase_entries, start=1)],
            "  </PurchaseInvoices>",
            "</iSAFFile>",
        ]
    )


def render_invoice_xml(entry: dict[str, Any], index: int) -> str:
    return "\n".join(
        [
            "    <Invoice>",
            f"      <LineNumber>{index}</LineNumber>",
            f"      <InvoiceNumber>{xml(entry.get('number', ''))}</InvoiceNumber>",
            f"      <InvoiceDate>{xml(entry.get('date', ''))}</InvoiceDate>",
            f"      <CounterpartyName>{xml(entry.get('partyName', ''))}</CounterpartyName>",
            f"      <CounterpartyCode>{xml(entry.get('partyCode') or 'ND')}</CounterpartyCode>",
            f"      <CounterpartyVATCode>{xml(entry.get('partyVatCode') or 'ND')}</CounterpartyVATCode>",
            f"      <TaxableAmount>{decimal(entry.get('subtotal'))}</TaxableAmount>",
            f"      <VATAmount>{decimal(entry.get('vat'))}</VATAmount>",
            f"      <TotalAmount>{decimal(entry.get('total'))}</TotalAmount>",
            "      <VATRate>21</VATRate>",
            f"      <SourceDocument>{xml(entry.get('sourceLabel', ''))}</SourceDocument>",
            "    </Invoice>",
        ]
    )


def receipt_totals(document: dict[str, Any]) -> dict[str, float]:
    if any(key in document for key in ("subtotal", "vat", "total")):
        subtotal = money(document.get("subtotal"))
        vat = money(document.get("vat"))
        total = money(document.get("total") or subtotal + vat)
        return {"subtotal": subtotal, "vat": vat, "total": total}
    subtotal = sum(money(item.get("quantity")) * money(item.get("unitPrice")) for item in document.get("lines", []))
    vat = subtotal * VAT_RATE
    return {"subtotal": money(subtotal), "vat": money(vat), "total": money(subtotal + vat)}


def sales_totals(document: dict[str, Any]) -> dict[str, float]:
    if any(key in document for key in ("subtotal", "vat", "total")):
        subtotal = money(document.get("subtotal"))
        vat = money(document.get("vat"))
        total = money(document.get("total") or subtotal + vat)
        paid = money(document.get("paidAmount"))
        return {"subtotal": subtotal, "vat": vat, "total": total, "paidAmount": paid, "debt": max(0, money(total - paid))}
    subtotal = vat = total = 0.0
    for item in document.get("lines", []):
        quantity = money(item.get("quantity"))
        unit_price = money(item.get("unitPrice"))
        discount_percent = money(item.get("discountPercent"))
        vat_rate = money(item.get("vatRate") or 21)
        line_subtotal = max(0, quantity * unit_price * (1 - discount_percent / 100))
        line_vat = line_subtotal * (vat_rate / 100)
        subtotal += line_subtotal
        vat += line_vat
        total += line_subtotal + line_vat
    paid = sum(money(payment.get("amount")) for payment in document.get("payments", []) or [])
    return {"subtotal": money(subtotal), "vat": money(vat), "total": money(total), "paidAmount": money(paid), "debt": max(0, money(total - paid))}


def delivery_cost(document: dict[str, Any], products: list[dict[str, Any]]) -> float:
    products_by_id = by_id(products)
    products_by_article = {str(item.get("article", "")): item for item in products}
    total = 0.0
    for item in document.get("lines", []):
        product = products_by_id.get(str(item.get("productId"))) or products_by_article.get(str(item.get("article", ""))) or {}
        unit_cost = money(product.get("cost") or item.get("unitCost"))
        total += money(item.get("quantity")) * unit_cost
    return money(total)


def customer_debt_total(payload: dict[str, Any]) -> float:
    total = 0.0
    for document in payload.get("salesDocuments", []):
        if document.get("type") in {"ORDER", "PREPAYMENT_INVOICE", "INVOICE", "DELIVERY_NOTE"} and str(document.get("status")) in {"CONFIRMED", "PARTIALLY_PAID"}:
            total += sales_totals(document)["debt"]
    return money(total)


def line_totals(lines: list[dict[str, Any]]) -> dict[str, float]:
    return {
        "debit": money(sum(item.get("debit", 0) for item in lines)),
        "credit": money(sum(item.get("credit", 0) for item in lines)),
    }


def vat_totals(entries: list[dict[str, Any]]) -> dict[str, float]:
    return {
        "subtotal": money(sum(item.get("subtotal", 0) for item in entries)),
        "vat": money(sum(item.get("vat", 0) for item in entries)),
        "total": money(sum(item.get("total", 0) for item in entries)),
    }


def account_debit(lines: list[dict[str, Any]], account_code: str) -> float:
    return money(sum(item["debit"] for item in lines if item["accountCode"] == account_code))


def account_credit(lines: list[dict[str, Any]], account_code: str) -> float:
    return money(sum(item["credit"] for item in lines if item["accountCode"] == account_code))


def missing_isaf_settings(settings: dict[str, Any]) -> list[str]:
    labels = [
        (settings.get("companyName"), "imones pavadinimas"),
        (settings.get("companyCode"), "imones kodas"),
        (settings.get("vatCode"), "PVM moketojo kodas"),
    ]
    return [label for value, label in labels if not str(value or "").strip()]


def isaf_deadline(period_date: str) -> str:
    value = parse_date(period_date)
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    return date(year, month, ISAF_MONTHLY_DEADLINE_DAY).isoformat()


def date_matches(value: str, date_from: str = "", date_to: str = "") -> bool:
    return (not date_from or value >= date_from) and (not date_to or value <= date_to)


def is_confirmed_receipt(document: dict[str, Any]) -> bool:
    return str(document.get("status")) in {"Patvirtintas", "CONFIRMED"}


def is_cancelled_or_draft(document: dict[str, Any]) -> bool:
    return str(document.get("status")) in {"DRAFT", "CANCELLED", "Juodrastis", "Atsauktas"}


def by_id(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(item.get("id")): item for item in items}


def money(value: Any) -> float:
    try:
        number = float(value or 0)
    except (TypeError, ValueError):
        number = 0.0
    return round(number + 0.000000001, 2)


def decimal(value: Any) -> str:
    return f"{money(value):.2f}"


def normalize_invoice_number(value: Any) -> str:
    return "".join(character for character in str(value or "").upper() if character.isalnum())


def parse_date(value: str) -> date:
    return date.fromisoformat(str(value or today_iso())[:10])


def today_iso() -> str:
    return date.today().isoformat()


def xml(value: Any) -> str:
    return escape(str(value or ""), quote=True)
