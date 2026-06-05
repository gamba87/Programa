import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const VAT_RATE = 0.21;
const STATUS_DRAFT = "Juodraštis";
const STATUS_CONFIRMED = "Patvirtintas";
const STATUS_CANCELLED = "Atšauktas";
const DB_STATUS = {
  [STATUS_DRAFT]: "DRAFT",
  [STATUS_CONFIRMED]: "CONFIRMED",
  [STATUS_CANCELLED]: "CANCELLED",
};
const UI_STATUS = {
  DRAFT: STATUS_DRAFT,
  CONFIRMED: STATUS_CONFIRMED,
  CANCELLED: STATUS_CANCELLED,
};
const SALES_TYPES = {
  OFFER: { label: "Pasiūlymas", plural: "Pasiūlymai", prefix: "PAS" },
  ORDER: { label: "Užsakymas", plural: "Užsakymai", prefix: "UZS" },
  PREPAYMENT_INVOICE: { label: "Išankstinė sąskaita", plural: "Išankstinės sąskaitos", prefix: "IS" },
  INVOICE: { label: "Sąskaita faktūra", plural: "Sąskaitos faktūros", prefix: "SF" },
  DELIVERY_NOTE: { label: "Važtaraštis", plural: "Važtaraščiai", prefix: "VAZ" },
};
const SALES_TYPE_ORDER = ["OFFER", "ORDER", "PREPAYMENT_INVOICE", "INVOICE", "DELIVERY_NOTE"];
const SALES_STATUS = {
  DRAFT: "Juodraštis",
  CONFIRMED: "Patvirtintas",
  PARTIALLY_PAID: "Dalinai apmokėtas",
  PAID: "Apmokėtas",
  CANCELLED: "Atšauktas",
};
const PAYMENT_METHODS = {
  BANK_TRANSFER: "Banko pavedimas",
  CASH: "Grynieji",
  CARD: "Kortelė",
  OTHER: "Kita",
};
const CONVERSION_TARGETS = {
  OFFER: ["ORDER"],
  ORDER: ["PREPAYMENT_INVOICE", "INVOICE", "DELIVERY_NOTE"],
  PREPAYMENT_INVOICE: ["INVOICE"],
  INVOICE: ["DELIVERY_NOTE"],
  DELIVERY_NOTE: [],
};
const database = createSupabaseDatabase(supabase, isSupabaseConfigured);

const sampleSuppliers = [
  {
    id: 1,
    name: "UAB Baltijos santechnika",
    code: "304112786",
    email: "uzsakymai@baltijos-santechnika.lt",
    phone: "+370 5 210 4560",
  },
  {
    id: 2,
    name: "UAB Vonia Pro",
    code: "302654911",
    email: "info@voniapro.lt",
    phone: "+370 37 441 205",
  },
  {
    id: 3,
    name: "Nordic Bath Distribution",
    code: "409887221",
    email: "sales@nordicbath.example",
    phone: "+370 6 530 1188",
  },
  {
    id: 4,
    name: "UAB Keramikos linija",
    code: "305884716",
    email: "sandelys@keramikoslinija.lt",
    phone: "+370 5 272 0144",
  },
];

const sampleProducts = [
  {
    id: 1,
    article: "MIX-1001",
    name: "Praustuvo maišytuvas Nordic 120",
    manufacturer: "Hansgrohe",
    category: "Maišytuvai",
    warehouse: "Vilnius",
    stock: 14,
    unit: "vnt.",
    cost: 72.4,
    price: 109.9,
    vat: 21,
  },
  {
    id: 2,
    article: "BAT-2040",
    name: "Akrilinė vonia Clara 170x75",
    manufacturer: "Ravak",
    category: "Vonios",
    warehouse: "Vilnius",
    stock: 5,
    unit: "vnt.",
    cost: 245,
    price: 349,
    vat: 21,
  },
  {
    id: 3,
    article: "CAB-3188",
    name: "Pakabinama spintelė su praustuvu Lino 80",
    manufacturer: "Jika",
    category: "Baldai",
    warehouse: "Kaunas",
    stock: 8,
    unit: "kompl.",
    cost: 168.7,
    price: 259,
    vat: 21,
  },
  {
    id: 4,
    article: "SHW-4502",
    name: "Dušo sistema Thermo Rain",
    manufacturer: "Grohe",
    category: "Dušo sistemos",
    warehouse: "Vilnius",
    stock: 11,
    unit: "kompl.",
    cost: 139.5,
    price: 219,
    vat: 21,
  },
  {
    id: 5,
    article: "TOI-7710",
    name: "Pakabinamas klozetas Rimless Nova",
    manufacturer: "Laufen",
    category: "Klozetai",
    warehouse: "Klaipėda",
    stock: 7,
    unit: "vnt.",
    cost: 126,
    price: 199,
    vat: 21,
  },
  {
    id: 6,
    article: "ACC-9124",
    name: "Rankšluosčių laikiklis Black Line",
    manufacturer: "Bemeta",
    category: "Aksesuarai",
    warehouse: "Kaunas",
    stock: 24,
    unit: "vnt.",
    cost: 18.2,
    price: 34.9,
    vat: 21,
  },
  {
    id: 7,
    article: "BAS-0288",
    name: "Keraminis praustuvas Oval 60",
    manufacturer: "Ideal Standard",
    category: "Praustuvai",
    warehouse: "Vilnius",
    stock: 13,
    unit: "vnt.",
    cost: 58,
    price: 95,
    vat: 21,
  },
  {
    id: 8,
    article: "MIR-6044",
    name: "Veidrodis su LED apšvietimu 90",
    manufacturer: "Elita",
    category: "Veidrodžiai",
    warehouse: "Klaipėda",
    stock: 4,
    unit: "vnt.",
    cost: 84.6,
    price: 139,
    vat: 21,
  },
];

const sampleDocuments = [
  {
    id: 1,
    number: "PJD-2026-05-001",
    supplierId: 1,
    supplierDocumentNumber: "BS-5518",
    date: "2026-05-08",
    notes: "Pradinė gegužės siunta.",
    status: STATUS_CONFIRMED,
    createdAt: "2026-05-08T09:12:00",
    updatedAt: "2026-05-08T10:03:00",
    confirmedAt: "2026-05-08T10:03:00",
    cancelledAt: "",
    lines: [
      snapshotLine(productByArticle(sampleProducts, "MIX-1001"), 6, 72.4),
      snapshotLine(productByArticle(sampleProducts, "ACC-9124"), 18, 18.2),
      snapshotLine(productByArticle(sampleProducts, "BAS-0288"), 8, 58),
    ],
  },
  {
    id: 2,
    number: "PJD-2026-05-002",
    supplierId: 2,
    supplierDocumentNumber: "VP-2049",
    date: "2026-05-19",
    notes: "Kainas patikrinti prieš patvirtinimą.",
    status: STATUS_DRAFT,
    createdAt: "2026-05-19T14:35:00",
    updatedAt: "2026-05-19T14:35:00",
    confirmedAt: "",
    cancelledAt: "",
    lines: [
      snapshotLine(productByArticle(sampleProducts, "BAT-2040"), 2, 245),
      snapshotLine(productByArticle(sampleProducts, "MIR-6044"), 1, 84.6),
    ],
  },
  {
    id: 3,
    number: "PJD-2026-05-003",
    supplierId: 4,
    supplierDocumentNumber: "KL-7781",
    date: "2026-05-27",
    notes: "Priimta į Kauno ir Vilniaus sandėlius.",
    status: STATUS_CONFIRMED,
    createdAt: "2026-05-27T11:20:00",
    updatedAt: "2026-05-27T11:55:00",
    confirmedAt: "2026-05-27T11:55:00",
    cancelledAt: "",
    lines: [
      snapshotLine(productByArticle(sampleProducts, "CAB-3188"), 5, 168.7),
      snapshotLine(productByArticle(sampleProducts, "SHW-4502"), 4, 139.5),
      snapshotLine(productByArticle(sampleProducts, "TOI-7710"), 3, 126),
    ],
  },
  {
    id: 4,
    number: "PJD-2026-04-001",
    supplierId: 3,
    supplierDocumentNumber: "NBD-4102",
    date: "2026-04-29",
    notes: "Atšaukta dėl tiekėjo klaidos sąskaitoje.",
    status: STATUS_CANCELLED,
    createdAt: "2026-04-29T08:45:00",
    updatedAt: "2026-04-30T09:14:00",
    confirmedAt: "2026-04-29T09:05:00",
    cancelledAt: "2026-04-30T09:14:00",
    lines: [
      snapshotLine(productByArticle(sampleProducts, "MIX-1001"), 1, 70),
      snapshotLine(productByArticle(sampleProducts, "ACC-9124"), 4, 17.5),
    ],
  },
];

const sampleStockHistory = createSampleStockHistory(sampleDocuments);
let activeState = null;

function blankPriceImport() {
  return {
    text: "",
    headers: [],
    columns: {
      article: -1,
      name: -1,
      manufacturer: -1,
      category: -1,
      cost: -1,
      price: -1,
      vat: -1,
      unit: -1,
    },
    delimiter: ";",
    headerLineIndex: -1,
    rows: [],
    errors: [],
    options: {
      updateCost: true,
      updatePrice: true,
      updateVat: false,
      updateName: false,
      updateManufacturer: false,
      createMissing: false,
    },
  };
}

const SPREADSHEET_IMPORT_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
const MAX_PRODUCT_STOCK_VALUE = 1000000;
const MAX_PRODUCT_PRICE_VALUE = 1000000;
let spreadsheetImportLibraryPromise = null;

const state = {
  page: database.isConfigured ? "work-center" : "database-setup",
  products: [],
  suppliers: [],
  documents: [],
  stockHistory: [],
  customers: [],
  salesDocuments: [],
  stockReservations: [],
  accountingSettings: blankAccountingSettings(),
  accountingSchemaReady: true,
  salesSchemaReady: true,
  salesAdvancedReady: false,
  selectedDocumentId: null,
  selectedProductId: null,
  selectedCustomerId: null,
  selectedSalesDocumentId: null,
  globalSearchQuery: "",
  productQuery: "",
  productStatusFilter: "active",
  productStockFilter: "all",
  priceImport: blankPriceImport(),
  stockHistoryQuery: "",
  customerQuery: "",
  customerDebtQuery: "",
  numberingDate: todayDate(),
  vatFilters: {
    from: monthStartDate(),
    to: todayDate(),
    register: "ALL",
  },
  salesTab: "OFFER",
  salesQuery: "",
  salesSort: { field: "date", direction: "desc" },
  salesPagination: { page: 1, pageSize: 20 },
  documentFilters: {
    from: "",
    to: "",
    supplierId: "",
    status: "",
    number: "",
  },
  salesFilters: {
    number: "",
    customerId: "",
    type: "",
    status: "",
    from: "",
    to: "",
    unpaidOnly: false,
    responsible: "",
  },
  modal: null,
  toast: "",
  isLoading: false,
  isSaving: false,
  currentUser: null,
  errorMessage: "",
  authNotice: "",
  pendingProductRowId: null,
  pendingSalesProductRowId: null,
  pendingConversion: null,
  newDoc: null,
  salesDraft: null,
};

activeState = state;
state.newDoc = blankDocument();
state.salesDraft = blankSalesDocument();

function productByArticle(products, article) {
  return products.find((product) => product.article === article);
}

function snapshotLine(product, quantity, unitPrice) {
  return {
    lineId: crypto.randomUUID(),
    productId: product?.id ?? null,
    article: product?.article ?? "",
    name: product?.name ?? "",
    unit: product?.unit ?? "vnt.",
    quantity,
    unitPrice,
  };
}

function withDocumentTotals(documents) {
  return documents.map((document) => ({ ...document, ...documentTotals(document.lines) }));
}

function blankDocument(date = todayDate()) {
  return {
    editingId: null,
    supplierId: "",
    number: nextDocumentNumber(date),
    supplierDocumentNumber: "",
    date,
    notes: "",
    rows: [blankRow()],
  };
}

function blankSalesDocument(type = state?.salesTab ?? "OFFER", date = todayDate()) {
  return {
    editingId: null,
    sourceDocumentId: "",
    type,
    number: nextSalesDocumentNumber(type, date),
    customerId: "",
    customerDocumentNumber: "",
    date,
    dueDate: addDays(date, 14),
    currency: "EUR",
    responsibleEmployee: state?.currentUser?.email ?? "",
    notes: "",
    reserveStock: type === "ORDER" && Boolean(state?.salesAdvancedReady),
    rows: [blankSalesRow()],
  };
}

function blankRow() {
  return {
    rowId: crypto.randomUUID(),
    productId: null,
    article: "",
    name: "",
    unit: "vnt.",
    quantity: 1,
    unitPrice: 0,
    lookupMessage: "",
    lookupMatches: [],
  };
}

function blankSalesRow() {
  return {
    rowId: crypto.randomUUID(),
    lineId: null,
    productId: null,
    article: "",
    name: "",
    unit: "vnt.",
    currentStock: 0,
    reservedStock: 0,
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    vatRate: 21,
    lookupMessage: "",
    lookupMatches: [],
  };
}

function blankAccountingSettings() {
  return {
    id: "main",
    companyName: "",
    companyCode: "",
    vatCode: "",
    address: "",
    email: "",
    phone: "",
    defaultCurrency: "EUR",
    softwareName: "Inventoriaus valdymas",
    softwareVersion: "1.0",
  };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartDate(date = todayDate()) {
  return `${date.slice(0, 7)}-01`;
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function nextDocumentNumber(date = todayDate()) {
  const month = date.slice(0, 7);
  const prefix = `PJD-${month}-`;
  const nextNumber =
    Math.max(
      0,
      ...stateSafeDocuments()
        .filter((document) => document.number.startsWith(prefix))
        .map((document) => Number(document.number.slice(prefix.length)) || 0),
    ) + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

function nextSalesDocumentNumber(type = "OFFER", date = todayDate()) {
  const month = date.slice(0, 7);
  const prefix = `${SALES_TYPES[type]?.prefix ?? "PD"}-${month}-`;
  const nextNumber =
    Math.max(
      0,
      ...(activeState?.salesDocuments ?? [])
        .filter((document) => document.number.startsWith(prefix))
        .map((document) => Number(document.number.slice(prefix.length)) || 0),
    ) + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

function stateSafeDocuments() {
  return activeState?.documents ?? sampleDocuments;
}

function createSampleStockHistory(documents) {
  return documents
    .flatMap((document) => {
      if (document.status === STATUS_DRAFT) return [];
      const confirmedEntries = document.lines.map((line) => {
        const product = productByArticle(sampleProducts, line.article);
        const afterStock = Math.max(Number(product?.stock) || 0, Number(line.quantity) || 0);
        return createStockHistoryEntry(
          document,
          line,
          1,
          Math.max(0, afterStock - Number(line.quantity)),
          afterStock,
          document.confirmedAt,
        );
      });

      if (document.status !== STATUS_CANCELLED) return confirmedEntries;

      const cancelledEntries = document.lines.map((line) => {
        const product = productByArticle(sampleProducts, line.article);
        const afterStock = Number(product?.stock) || 0;
        return createStockHistoryEntry(
          document,
          line,
          -1,
          afterStock + Number(line.quantity),
          afterStock,
          document.cancelledAt,
        );
      });
      return [...confirmedEntries, ...cancelledEntries];
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function createStockHistoryEntry(document, line, direction, beforeStock, afterStock, date = nowIso()) {
  return {
    id: crypto.randomUUID(),
    date,
    documentId: document.id,
    documentNumber: document.number,
    productId: line.productId,
    article: line.article,
    name: line.name,
    unit: line.unit || "vnt.",
    action: direction > 0 ? "Pajamavimas" : "Atšaukimas",
    movementType: direction > 0 ? "RECEIPT_CONFIRM" : "RECEIPT_CANCEL",
    referenceType: "RECEIPT_DOCUMENT",
    comment: "",
    quantity: direction * Number(line.quantity),
    beforeStock,
    afterStock,
  };
}

function persistState() {
  // Supabase is the persisted data store. This hook is kept empty for the existing render flow.
}

function isMissingOptionalSalesSchema(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "42P01" || message.includes("does not exist") || message.includes("schema cache");
}

function isPermissionDenied(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "42501" || message.includes("permission denied");
}

function isOptionalSalesSchemaUnavailable(error) {
  return isMissingOptionalSalesSchema(error) || isPermissionDenied(error);
}

function isOptionalSchemaUnavailable(error) {
  return isMissingOptionalSalesSchema(error) || isPermissionDenied(error);
}

async function loadAccountingBundle(db) {
  const settings = await db.from("accounting_settings").select("*").eq("id", "main").maybeSingle();

  if (settings.error && isOptionalSchemaUnavailable(settings.error)) {
    return {
      schemaReady: false,
      settings: blankAccountingSettings(),
    };
  }
  if (settings.error) throw new Error(settings.error.message || "Nepavyko įkelti buhalterijos nustatymų.");

  return {
    schemaReady: true,
    settings: settings.data ? fromDbAccountingSettings(settings.data) : blankAccountingSettings(),
  };
}

async function loadSalesBundle(db) {
  const [customers, documents, lines, payments, relations, reservations] = await Promise.all([
    db.from("customers").select("*").order("name", { ascending: true }),
    db.from("sales_documents").select("*").order("created_at", { ascending: false }),
    db.from("sales_document_lines").select("*").order("created_at", { ascending: true }),
    db.from("payments").select("*").order("payment_date", { ascending: false }),
    db.from("document_relations").select("*").order("created_at", { ascending: true }),
    db.from("stock_reservations").select("*").eq("status", "ACTIVE").order("created_at", { ascending: false }),
  ]);

  const results = [customers, documents, lines, payments, relations, reservations];
  const missingSalesSchema = results.some((result) => result.error && isOptionalSalesSchemaUnavailable(result.error));

  if (missingSalesSchema) {
    return {
      schemaReady: false,
      advancedReady: false,
      customers: [],
      salesDocuments: [],
      stockReservations: [],
    };
  }

  results.forEach((result) => {
    if (result.error) throw new Error(result.error.message || "Nepavyko įkelti pardavimų duomenų.");
  });

  const advancedCheck = await db.rpc("generate_sales_document_number", {
    p_document_type: "OFFER",
    p_document_date: todayDate(),
  });

  return {
    schemaReady: true,
    advancedReady: !advancedCheck.error,
    customers: customers.data.map(fromDbCustomer),
    salesDocuments: documents.data.map((document) =>
      fromDbSalesDocument(
        document,
        lines.data.filter((line) => idsEqual(line.sales_document_id, document.id)),
        payments.data.filter((payment) => idsEqual(payment.sales_document_id, document.id)),
        relations.data.filter((relation) => idsEqual(relation.source_document_id, document.id) || idsEqual(relation.target_document_id, document.id)),
      ),
    ),
    stockReservations: reservations.data.map(fromDbStockReservation),
  };
}

function createSupabaseDatabase(client, isConfigured) {
  function ensureClient() {
    if (!isConfigured || !client) throw new Error("Supabase neprijungtas.");
    return client;
  }

  function unwrap(result, fallbackMessage = "Supabase užklausa nepavyko.") {
    if (result.error) throw new Error(friendlyDatabaseError(result.error, fallbackMessage));
    return result.data;
  }

  return {
    isConfigured,
    async loadAll() {
      const db = ensureClient();
      const [products, suppliers, documents, movements, salesBundle, accountingBundle] = await Promise.all([
        db.from("products").select("*").order("article_code", { ascending: true }),
        db.from("suppliers").select("*").eq("is_active", true).order("company_name", { ascending: true }),
        db.from("receipt_documents").select("*,receipt_document_lines(*)").order("created_at", { ascending: false }),
        db
          .from("stock_movements")
          .select("*,products(article_code,name,unit),receipt_documents(document_number)")
          .order("created_at", { ascending: false }),
        loadSalesBundle(db),
        loadAccountingBundle(db),
      ]);
      return {
        products: unwrap(products).map(fromDbProduct),
        suppliers: unwrap(suppliers).map(fromDbSupplier),
        documents: withDocumentTotals(unwrap(documents).map(fromDbDocument)),
        stockHistory: unwrap(movements).map(fromDbStockMovement),
        customers: salesBundle.customers,
        salesDocuments: salesBundle.salesDocuments,
        stockReservations: salesBundle.stockReservations,
        accountingSettings: accountingBundle.settings,
        accountingSchemaReady: accountingBundle.schemaReady,
        salesSchemaReady: salesBundle.schemaReady,
        salesAdvancedReady: salesBundle.advancedReady,
      };
    },
    async saveProduct(product) {
      const db = ensureClient();
      const payload = toDbProduct(product);
      if (product.id) {
        const saved = unwrap(
          await db.from("products").update(payload).eq("id", product.id).select().single(),
          "Nepavyko atnaujinti prekės.",
        );
        return fromDbProduct(saved);
      }
      const saved = unwrap(
        await db.from("products").insert(payload).select().single(),
        "Nepavyko sukurti prekės.",
      );
      return fromDbProduct(saved);
    },
    async deleteProduct(id) {
      const db = ensureClient();
      const salesUsage = await db
        .from("sales_document_lines")
        .select("id,sales_documents!inner(status,document_type)")
        .eq("product_id", id)
        .in("sales_documents.document_type", ["INVOICE", "DELIVERY_NOTE"])
        .in("sales_documents.status", ["CONFIRMED", "PARTIALLY_PAID", "PAID"])
        .limit(1);

      if (salesUsage.error && !isMissingOptionalSalesSchema(salesUsage.error)) {
        throw new Error(salesUsage.error.message || "Nepavyko patikrinti prekės pardavimo istorijos.");
      }
      if ((salesUsage.data ?? []).length) {
        throw new Error("Prekės pašalinti negalima, nes ji turi pardavimo istoriją.");
      }

      unwrap(
        await db.from("products").update({ is_active: false }).eq("id", id),
        "Nepavyko pašalinti prekės.",
      );
    },
    async restoreProduct(id) {
      unwrap(
        await ensureClient().from("products").update({ is_active: true }).eq("id", id),
        "Nepavyko grąžinti prekės į aktyvų sąrašą.",
      );
    },
    async saveAccountingSettings(settings) {
      const saved = unwrap(
        await ensureClient()
          .from("accounting_settings")
          .upsert(toDbAccountingSettings(settings), { onConflict: "id" })
          .select()
          .single(),
        "Nepavyko išsaugoti įmonės buhalterijos nustatymų.",
      );
      return fromDbAccountingSettings(saved);
    },
    async saveSupplier(supplier) {
      const db = ensureClient();
      const payload = toDbSupplier(supplier);
      if (supplier.id) {
        const saved = unwrap(
          await db.from("suppliers").update(payload).eq("id", supplier.id).select().single(),
          "Nepavyko atnaujinti tiekėjo.",
        );
        return fromDbSupplier(saved);
      }
      const saved = unwrap(
        await db.from("suppliers").insert(payload).select().single(),
        "Nepavyko sukurti tiekėjo.",
      );
      return fromDbSupplier(saved);
    },
    async saveCustomer(customer) {
      const db = ensureClient();
      const payload = toDbCustomer(customer);
      if (customer.id) {
        const saved = unwrap(
          await db.from("customers").update(payload).eq("id", customer.id).select().single(),
          "Nepavyko atnaujinti kliento.",
        );
        return fromDbCustomer(saved);
      }
      const saved = unwrap(
        await db.from("customers").insert(payload).select().single(),
        "Nepavyko sukurti kliento.",
      );
      return fromDbCustomer(saved);
    },
    async saveSalesDraft(document) {
      const db = ensureClient();
      const payload = toDbSalesDocument(document, "DRAFT");
      let savedDocument;
      if (document.id) {
        savedDocument = unwrap(
          await db
            .from("sales_documents")
            .update(payload)
            .eq("id", document.id)
            .eq("status", "DRAFT")
            .select()
            .maybeSingle(),
          "Nepavyko atnaujinti pardavimo juodraščio.",
        );
        if (!savedDocument) throw new Error("Redaguoti galima tik pardavimo juodraštį.");
        unwrap(
          await db.from("sales_document_lines").delete().eq("sales_document_id", document.id),
          "Nepavyko atnaujinti pardavimo eilučių.",
        );
      } else {
        savedDocument = unwrap(
          await db.from("sales_documents").insert(payload).select().single(),
          "Nepavyko sukurti pardavimo juodraščio.",
        );
        if (document.sourceDocumentId) {
          unwrap(
            await db.from("document_relations").insert({
              source_document_id: document.sourceDocumentId,
              target_document_id: savedDocument.id,
              relation_type: "CONVERTED_TO",
            }),
            "Nepavyko išsaugoti dokumentų ryšio.",
          );
        }
      }

      const lines = document.lines.map((line) => toDbSalesLine(savedDocument.id, line));
      if (lines.length) {
        unwrap(
          await db.from("sales_document_lines").insert(lines),
          "Nepavyko išsaugoti pardavimo dokumento eilučių.",
        );
      }
      if (document.type === "ORDER" && document.reserveStock) {
        unwrap(await db.rpc("create_stock_reservation", { p_document_id: savedDocument.id }));
      }
      return savedDocument.id;
    },
    async deleteSalesDraft(id) {
      unwrap(
        await ensureClient().from("sales_documents").delete().eq("id", id).eq("status", "DRAFT"),
        "Nepavyko ištrinti pardavimo juodraščio.",
      );
    },
    async cancelSalesDocument(id) {
      unwrap(
        await ensureClient()
          .from("sales_documents")
          .update({ status: "CANCELLED" })
          .eq("id", id)
          .neq("status", "CANCELLED"),
        "Nepavyko atšaukti pardavimo dokumento.",
      );
    },
    async confirmDeliveryNote(id) {
      unwrap(await ensureClient().rpc("confirm_delivery_note", { p_document_id: id }));
    },
    async cancelDeliveryNote(id) {
      unwrap(await ensureClient().rpc("cancel_delivery_note", { p_document_id: id }));
    },
    async reserveSalesDocument(id) {
      unwrap(await ensureClient().rpc("create_stock_reservation", { p_document_id: id }));
    },
    async cancelSalesReservation(id) {
      unwrap(await ensureClient().rpc("cancel_stock_reservation", { p_document_id: id }));
    },
    async registerPayment(payment) {
      unwrap(
        await ensureClient().rpc("register_payment", {
          p_document_id: payment.documentId,
          p_payment_date: payment.paymentDate,
          p_amount: Number(payment.amount),
          p_payment_method: payment.method,
          p_notes: payment.notes,
        }),
      );
    },
    async saveDraft(document) {
      const db = ensureClient();
      const documentPayload = toDbReceiptDocument(document, STATUS_DRAFT);
      let savedDocument;
      if (document.id) {
        savedDocument = unwrap(
          await db
            .from("receipt_documents")
            .update(documentPayload)
            .eq("id", document.id)
            .eq("status", "DRAFT")
            .select()
            .maybeSingle(),
          "Nepavyko atnaujinti juodraščio.",
        );
        if (!savedDocument) throw new Error("Redaguoti galima tik juodraštį.");
        unwrap(
          await db.from("receipt_document_lines").delete().eq("receipt_document_id", document.id),
          "Nepavyko atnaujinti dokumento eilučių.",
        );
      } else {
        savedDocument = unwrap(
          await db.from("receipt_documents").insert(documentPayload).select().single(),
          "Nepavyko sukurti juodraščio.",
        );
      }

      const lines = document.lines.map((line) => toDbReceiptLine(savedDocument.id, line));
      if (lines.length) {
        unwrap(
          await db.from("receipt_document_lines").insert(lines),
          "Nepavyko išsaugoti dokumento eilučių.",
        );
      }
      return savedDocument.id;
    },
    async confirmDocument(id) {
      unwrap(await ensureClient().rpc("confirm_receipt_document", { p_document_id: id }));
    },
    async cancelDocument(id) {
      unwrap(await ensureClient().rpc("cancel_receipt_document", { p_document_id: id }));
    },
    async deleteDraftDocument(id) {
      unwrap(await ensureClient().rpc("delete_draft_receipt_document", { p_document_id: id }));
    },
  };
}

function fromDbProduct(product) {
  return {
    id: product.id,
    article: product.article_code,
    name: product.name,
    manufacturer: product.manufacturer ?? "",
    category: product.category ?? "",
    warehouse: product.warehouse_location ?? "",
    stock: Number(product.current_stock) || 0,
    minimumStock: Number(product.minimum_stock) || 0,
    unit: product.unit ?? "vnt.",
    cost: Number(product.purchase_price) || 0,
    price: Number(product.sale_price) || 0,
    vat: Number(product.vat_rate) || 0,
    notes: product.notes ?? "",
    isActive: product.is_active !== false,
  };
}

function toDbProduct(product) {
  return {
    article_code: product.article,
    name: product.name,
    manufacturer: product.manufacturer,
    category: product.category,
    warehouse_location: product.warehouse,
    current_stock: safeProductDecimal(product.stock, "Likutis", 0, MAX_PRODUCT_STOCK_VALUE),
    minimum_stock: safeProductDecimal(product.minimumStock, "Minimalus likutis", 0, MAX_PRODUCT_STOCK_VALUE),
    unit: product.unit || "vnt.",
    purchase_price: safeProductDecimal(product.cost, "Savikaina", 0, MAX_PRODUCT_PRICE_VALUE),
    sale_price: safeProductDecimal(product.price, "Pardavimo kaina", 0, MAX_PRODUCT_PRICE_VALUE),
    vat_rate: safeProductDecimal(product.vat || 21, "PVM", 0, 100),
    notes: product.notes ?? "",
    is_active: product.isActive !== false,
  };
}

function friendlyDatabaseError(error, fallbackMessage = "Supabase užklausa nepavyko.") {
  const message = error?.message || fallbackMessage;
  if (String(message).toLowerCase().includes("numeric field overflow")) {
    return "Skaičius per didelis duomenų bazei. Patikrinkite kainininko stulpelių priskyrimą: GTIN/EAN neturi būti kaina, PVM ar artikulas.";
  }
  return message;
}

function safeProductDecimal(value, label, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label} reikšmė neteisinga arba per didelė. Patikrinkite kainininko stulpelių priskyrimą.`);
  }
  return Number(number.toFixed(4));
}

function fromDbSupplier(supplier) {
  return {
    id: supplier.id,
    name: supplier.company_name,
    code: supplier.company_code ?? "",
    vatCode: supplier.vat_code ?? "",
    contactPerson: supplier.contact_person ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
    isActive: supplier.is_active !== false,
  };
}

function toDbSupplier(supplier) {
  return {
    company_name: supplier.name,
    company_code: supplier.code,
    vat_code: supplier.vatCode ?? "",
    contact_person: supplier.contactPerson ?? "",
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
    is_active: supplier.isActive !== false,
  };
}

function fromDbAccountingSettings(settings) {
  return {
    id: settings.id ?? "main",
    companyName: settings.company_name ?? "",
    companyCode: settings.company_code ?? "",
    vatCode: settings.vat_code ?? "",
    address: settings.address ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    defaultCurrency: settings.default_currency ?? "EUR",
    softwareName: settings.software_name ?? "Inventoriaus valdymas",
    softwareVersion: settings.software_version ?? "1.0",
  };
}

function toDbAccountingSettings(settings) {
  return {
    id: "main",
    company_name: settings.companyName,
    company_code: settings.companyCode,
    vat_code: settings.vatCode,
    address: settings.address,
    email: settings.email,
    phone: settings.phone,
    default_currency: settings.defaultCurrency || "EUR",
    software_name: settings.softwareName || "Inventoriaus valdymas",
    software_version: settings.softwareVersion || "1.0",
  };
}

function fromDbCustomer(customer) {
  return {
    id: customer.id,
    type: customer.customer_type ?? "COMPANY",
    name: customer.name,
    companyCode: customer.company_code ?? "",
    vatCode: customer.vat_code ?? "",
    address: customer.address ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    contactPerson: customer.contact_person ?? "",
    notes: customer.notes ?? "",
    isActive: customer.is_active !== false,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}

function toDbCustomer(customer) {
  return {
    customer_type: customer.type,
    name: customer.name,
    company_code: customer.companyCode,
    vat_code: customer.vatCode,
    address: customer.address,
    email: customer.email,
    phone: customer.phone,
    contact_person: customer.contactPerson,
    notes: customer.notes,
    is_active: customer.isActive !== false,
  };
}

function fromDbDocument(document) {
  const lines = (document.receipt_document_lines ?? []).map((line) => ({
    lineId: line.id,
    productId: line.product_id,
    article: line.article_code_snapshot,
    name: line.product_name_snapshot,
    unit: line.unit_snapshot,
    quantity: Number(line.quantity) || 0,
    unitPrice: Number(line.unit_price) || 0,
    vat: Number(line.vat_rate) || 21,
  }));
  const totals = documentTotals(lines);
  return {
    id: document.id,
    number: document.document_number,
    supplierId: document.supplier_id,
    supplierDocumentNumber: document.supplier_document_number ?? "",
    date: document.document_date,
    notes: document.notes ?? "",
    status: UI_STATUS[document.status] ?? STATUS_DRAFT,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    confirmedAt: document.confirmed_at ?? "",
    cancelledAt: document.cancelled_at ?? "",
    lines,
    subtotal: totals.subtotal,
    vat: totals.vat,
    total: totals.total,
  };
}

function fromDbSalesDocument(document, lines = [], payments = [], relations = []) {
  const mappedLines = lines.map(fromDbSalesLine);
  const mappedPayments = payments.map(fromDbPayment);
  const totals = salesDocumentTotals(mappedLines, mappedPayments);
  return {
    id: document.id,
    type: document.document_type,
    number: document.document_number,
    customerId: document.customer_id,
    customerDocumentNumber: document.customer_document_number ?? "",
    date: document.document_date,
    dueDate: document.due_date ?? "",
    currency: document.currency ?? "EUR",
    responsibleEmployee: document.responsible_employee ?? "",
    notes: document.notes ?? "",
    status: document.status ?? "DRAFT",
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    confirmedAt: document.confirmed_at ?? "",
    cancelledAt: document.cancelled_at ?? "",
    paidAmount: Number(document.paid_amount) || totals.paidAmount,
    sourceDocumentId: "",
    reserveStock: false,
    lines: mappedLines,
    payments: mappedPayments,
    relations,
    ...totals,
  };
}

function fromDbSalesLine(line) {
  const product = state.products.find((item) => idsEqual(item.id, line.product_id));
  return {
    lineId: line.id,
    productId: line.product_id,
    article: line.article_code_snapshot,
    name: line.product_name_snapshot,
    unit: line.unit_snapshot ?? "vnt.",
    currentStock: product?.stock ?? 0,
    reservedStock: reservedQuantityForProduct(line.product_id),
    quantity: Number(line.quantity) || 0,
    unitPrice: Number(line.unit_price) || 0,
    discountPercent: Number(line.discount_percent) || 0,
    vatRate: Number(line.vat_rate) || 21,
    lookupMessage: "",
    lookupMatches: [],
  };
}

function toDbSalesDocument(document, status = "DRAFT") {
  const totals = salesDocumentTotals(document.lines, []);
  const payload = {
    document_type: document.type,
    customer_id: document.customerId,
    customer_document_number: document.customerDocumentNumber,
    document_date: document.date,
    due_date: document.dueDate || null,
    status,
    currency: document.currency || "EUR",
    responsible_employee: document.responsibleEmployee,
    notes: document.notes,
    subtotal: totals.subtotal,
    discount_total: totals.discountTotal,
    vat_total: totals.vat,
    total: totals.total,
    paid_amount: 0,
  };
  payload.document_number = document.number;
  return payload;
}

function toDbSalesLine(documentId, line) {
  const totals = salesLineTotals(line);
  return {
    sales_document_id: documentId,
    product_id: line.productId,
    article_code_snapshot: line.article,
    product_name_snapshot: line.name,
    unit_snapshot: line.unit || "vnt.",
    quantity: Number(line.quantity),
    unit_price: Number(line.unitPrice),
    discount_percent: Number(line.discountPercent) || 0,
    vat_rate: Number(line.vatRate) || 21,
    line_subtotal: totals.subtotal,
    line_discount: totals.discount,
    line_vat: totals.vat,
    line_total: totals.total,
  };
}

function fromDbPayment(payment) {
  return {
    id: payment.id,
    documentId: payment.sales_document_id,
    paymentDate: payment.payment_date,
    amount: Number(payment.amount) || 0,
    method: payment.payment_method,
    notes: payment.notes ?? "",
    createdAt: payment.created_at,
  };
}

function fromDbStockReservation(reservation) {
  return {
    id: reservation.id,
    documentId: reservation.sales_document_id,
    lineId: reservation.sales_document_line_id,
    productId: reservation.product_id,
    quantity: Number(reservation.quantity) || 0,
    status: reservation.status,
    createdAt: reservation.created_at,
    releasedAt: reservation.released_at ?? "",
  };
}

function toDbReceiptDocument(document, status) {
  const totals = documentTotals(document.lines);
  return {
    document_number: document.number,
    supplier_id: document.supplierId,
    supplier_document_number: document.supplierDocumentNumber,
    document_date: document.date,
    status: DB_STATUS[status],
    notes: document.notes,
    subtotal: totals.subtotal,
    vat_total: totals.vat,
    total: totals.total,
  };
}

function toDbReceiptLine(documentId, line) {
  const lineVat = lineSubtotal(line) * ((Number(line.vat) || VAT_RATE * 100) / 100);
  return {
    receipt_document_id: documentId,
    product_id: line.productId,
    article_code_snapshot: line.article,
    product_name_snapshot: line.name,
    unit_snapshot: line.unit || "vnt.",
    quantity: Number(line.quantity),
    unit_price: Number(line.unitPrice),
    vat_rate: Number(line.vat) || 21,
    line_subtotal: lineSubtotal(line),
    line_vat: lineVat,
    line_total: lineSubtotal(line) + lineVat,
  };
}

function fromDbStockMovement(entry) {
  const product = entry.products ?? {};
  const document = entry.receipt_documents ?? {};
  return {
    id: entry.id,
    date: entry.created_at,
    documentId: entry.reference_id ?? entry.sales_document_id,
    documentNumber: document.document_number ?? entry.reference_number ?? "",
    productId: entry.product_id,
    article: product.article_code ?? "",
    name: product.name ?? "",
    unit: product.unit ?? "vnt.",
    action: stockMovementAction(entry.movement_type),
    movementType: entry.movement_type ?? "",
    referenceType: entry.reference_type ?? "",
    comment: entry.comment ?? "",
    quantity: Number(entry.quantity_delta) || 0,
    beforeStock: (Number(entry.stock_after_movement) || 0) - (Number(entry.quantity_delta) || 0),
    afterStock: Number(entry.stock_after_movement) || 0,
  };
}

function stockMovementAction(movementType) {
  const type = String(movementType ?? "").toUpperCase();
  if (type === "RECEIPT_CANCEL") return "Atšaukimas";
  if (type === "ISSUE" || type.includes("SALE") || type.includes("PARDAV")) return "Pardavimas";
  if (type === "ISSUE_REVERSAL") return "Pardavimo atšaukimas";
  if (type === "RECEIPT_CONFIRM") return "Pajamavimas";
  return "Koregavimas";
}

function formatMoney(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("lt-LT", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return value || "";
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function supplierName(id) {
  return state.suppliers.find((supplier) => idsEqual(supplier.id, id))?.name ?? "";
}

function documentTotals(rows) {
  const subtotal = rows.reduce((sum, row) => sum + lineSubtotal(row), 0);
  const vat = rows.reduce((sum, row) => sum + lineSubtotal(row) * ((Number(row.vat) || VAT_RATE * 100) / 100), 0);
  return {
    itemCount: rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
    subtotal,
    vat,
    total: subtotal + vat,
  };
}

function lineSubtotal(row) {
  return (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
}

function salesDocumentTotals(rows, payments = []) {
  const lineTotals = rows.map(salesLineTotals);
  const subtotal = lineTotals.reduce((sum, row) => sum + row.subtotal, 0);
  const discountTotal = lineTotals.reduce((sum, row) => sum + row.discount, 0);
  const vat = lineTotals.reduce((sum, row) => sum + row.vat, 0);
  const total = lineTotals.reduce((sum, row) => sum + row.total, 0);
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return {
    itemCount: rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
    subtotal,
    discountTotal,
    vat,
    total,
    paidAmount,
    debt: Math.max(0, total - paidAmount),
  };
}

function salesLineTotals(row) {
  const quantity = Number(row.quantity) || 0;
  const unitPrice = Number(row.unitPrice) || 0;
  const discountPercent = Number(row.discountPercent) || 0;
  const vatRate = Number(row.vatRate) || 21;
  const grossSubtotal = quantity * unitPrice;
  const discount = grossSubtotal * (discountPercent / 100);
  const subtotal = Math.max(0, grossSubtotal - discount);
  const vat = subtotal * (vatRate / 100);
  return {
    grossSubtotal,
    discount,
    subtotal,
    vat,
    total: subtotal + vat,
  };
}

function reservedQuantityForProduct(productId, excludedDocumentId = "") {
  return state.stockReservations
    .filter((reservation) => idsEqual(reservation.productId, productId) && !idsEqual(reservation.documentId, excludedDocumentId))
    .reduce((sum, reservation) => sum + Number(reservation.quantity), 0);
}

function freeStockForProduct(product, excludedDocumentId = "") {
  return Math.max(0, Number(product?.stock) - reservedQuantityForProduct(product?.id, excludedDocumentId));
}

function customerName(id) {
  return state.customers.find((customer) => idsEqual(customer.id, id))?.name ?? "";
}

function setPage(page) {
  state.page = page;
  if (page !== "document-detail") {
    state.selectedDocumentId = null;
  }
  if (page !== "product-detail") {
    state.selectedProductId = null;
  }
  if (page !== "customer-detail") {
    state.selectedCustomerId = null;
  }
  if (page !== "sales-document-detail") {
    state.selectedSalesDocumentId = null;
  }
  render();
}

function setToast(message) {
  state.toast = message;
  render();
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 3000);
}

async function initApp() {
  if (!database.isConfigured) {
    render();
    return;
  }
  await loadAuthSession();
  supabase.auth.onAuthStateChange((_event, session) => {
    state.currentUser = session?.user ?? null;
    if (state.currentUser && !state.products.length && !state.isLoading) {
      void reloadAllData();
    } else {
      render();
    }
  });
  if (!state.currentUser) {
    render();
    return;
  }
  await reloadAllData();
}

async function loadAuthSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(authErrorMessage(error));
    state.currentUser = data.session?.user ?? null;
  } catch (error) {
    state.currentUser = null;
    state.errorMessage = error.message;
  }
}

async function signInWithPassword(email, password) {
  await runSaving(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(authErrorMessage(error));
    state.currentUser = data.user;
    state.authNotice = "";
    await reloadAllData();
    setToast("Prisijungta sėkmingai.");
  });
}

async function signOut() {
  await runSaving(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    state.currentUser = null;
    state.products = [];
    state.suppliers = [];
    state.documents = [];
    state.stockHistory = [];
    state.customers = [];
    state.salesDocuments = [];
    state.stockReservations = [];
    state.accountingSettings = blankAccountingSettings();
    state.accountingSchemaReady = true;
    state.page = "work-center";
    state.modal = null;
    state.authNotice = "Atsijungėte. Prisijunkite iš naujo, kad matytumėte inventoriaus sistemą.";
    setToast("Atsijungta. Inventoriaus puslapiai paslėpti.");
  });
}

function authErrorMessage(error) {
  const message = String(error?.message ?? "").toLowerCase();
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Neteisingas el. paštas arba slaptažodis. Patikrinkite duomenis ir bandykite dar kartą.";
  }
  if (message.includes("email not confirmed")) {
    return "El. paštas dar nepatvirtintas. Supabase vartotojų lange pažymėkite Auto Confirm arba patvirtinkite vartotoją.";
  }
  return "Prisijungti nepavyko. Patikrinkite el. paštą, slaptažodį ir bandykite dar kartą.";
}

async function reloadAllData() {
  state.isLoading = true;
  state.errorMessage = "";
  render();
  try {
    const data = await database.loadAll();
    state.products = data.products;
    state.suppliers = data.suppliers;
    state.documents = data.documents;
    state.stockHistory = data.stockHistory;
    state.customers = data.customers;
    state.salesDocuments = data.salesDocuments;
    state.stockReservations = data.stockReservations;
    state.accountingSettings = data.accountingSettings;
    state.accountingSchemaReady = data.accountingSchemaReady;
    state.salesSchemaReady = data.salesSchemaReady;
    state.salesAdvancedReady = data.salesAdvancedReady;
    state.newDoc = blankDocument();
    state.salesDraft = blankSalesDocument(state.salesTab);
  } catch (error) {
    state.errorMessage = error.message;
    setToast(`Klaida: ${error.message}`);
  } finally {
    state.isLoading = false;
    render();
  }
}

async function runSaving(task) {
  state.isSaving = true;
  state.errorMessage = "";
  render();
  try {
    await task();
  } catch (error) {
    state.errorMessage = error.message;
    setToast(`Klaida: ${error.message}`);
  } finally {
    state.isSaving = false;
    render();
  }
}

function render() {
  persistState();
  const app = document.querySelector("#app");
  app.innerHTML = `
    ${renderSidebar()}
    <main class="content">
      ${state.errorMessage ? `<div class="toast error-toast">${escapeHtml(state.errorMessage)}</div>` : ""}
      ${renderPage()}
    </main>
    ${state.modal ? renderModal() : ""}
    ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    ${renderProductDatalist()}
  `;
  bindEvents();
}

function renderSidebar() {
  const showNavigation = database.isConfigured && state.currentUser;
  const items = [
    { page: "work-center", label: "Darbo centras", icon: "⌂" },
    { page: "products", label: "Prekės", icon: "▦" },
    { page: "customers", label: "Klientai", icon: "◎" },
    { page: "customer-debts", label: "Klientų skolos", icon: "€" },
    { page: "documents", label: "Pirkimai", icon: "≡" },
    { page: "price-import", label: "Kainininkai", icon: "€" },
  ];

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">IV</div>
        <div>
          <p class="brand-title">Inventoriaus valdymas</p>
          <p class="brand-subtitle">Sandėlis ir pardavimai</p>
        </div>
      </div>
      ${
        showNavigation
          ? `${renderGlobalSearch()}
            <nav class="nav" aria-label="Pagrindinė navigacija">
              ${items
                .map(
                  (item) => `
                    <button class="nav-button ${sidebarItemActive(item.page) ? "active" : ""}" data-page="${item.page}">
                      <span class="nav-icon">${item.icon}</span>
                      <span>${item.label}</span>
                    </button>
                  `,
                )
                .join("")}
              <details class="nav-section" ${["suppliers", "stock-history", "new-document"].includes(state.page) ? "open" : ""}>
                <summary>Kita</summary>
                <div class="nav-sub">
                  <button class="nav-button sub-button ${state.page === "new-document" ? "active" : ""}" data-page="new-document">
                    <span class="nav-icon">+</span>
                    <span>Naujas pirkimas</span>
                  </button>
                  <button class="nav-button sub-button ${state.page === "suppliers" ? "active" : ""}" data-page="suppliers">
                    <span class="nav-icon">◇</span>
                    <span>Tiekėjai</span>
                  </button>
                  <button class="nav-button sub-button ${state.page === "stock-history" ? "active" : ""}" data-page="stock-history">
                    <span class="nav-icon">↕</span>
                    <span>Likučių istorija</span>
                  </button>
                </div>
              </details>
              <details class="nav-section" ${["sales", "new-sales-document", "sales-document-detail", "numbering"].includes(state.page) ? "open" : ""}>
                <summary>Pardavimai</summary>
                <div class="nav-sub">
                  ${SALES_TYPE_ORDER.map(
                    (type) => `
                      <button class="nav-button sub-button ${state.page === "sales" && state.salesTab === type ? "active" : ""}" data-page="sales" data-sales-tab="${type}">
                        <span class="nav-icon">•</span>
                        <span>${SALES_TYPES[type].plural}</span>
                      </button>
                    `,
                  ).join("")}
                  <button class="nav-button sub-button ${state.page === "new-sales-document" ? "active" : ""}" data-page="new-sales-document">
                    <span class="nav-icon">+</span>
                    <span>Naujas dokumentas</span>
                  </button>
                  <button class="nav-button sub-button ${state.page === "numbering" ? "active" : ""}" data-page="numbering">
                    <span class="nav-icon">#</span>
                    <span>Numeracija</span>
                  </button>
                </div>
              </details>
              <details class="nav-section" ${["vat-registers", "isaf-export", "accounting-settings"].includes(state.page) ? "open" : ""}>
                <summary>Buhalterija</summary>
                <div class="nav-sub">
                  <button class="nav-button sub-button ${state.page === "vat-registers" ? "active" : ""}" data-page="vat-registers">
                    <span class="nav-icon">%</span>
                    <span>PVM registrai</span>
                  </button>
                  <button class="nav-button sub-button ${state.page === "isaf-export" ? "active" : ""}" data-page="isaf-export">
                    <span class="nav-icon">XML</span>
                    <span>i.SAF eksportas</span>
                  </button>
                  <button class="nav-button sub-button ${state.page === "accounting-settings" ? "active" : ""}" data-page="accounting-settings">
                    <span class="nav-icon">⚙</span>
                    <span>Įmonės nustatymai</span>
                  </button>
                </div>
              </details>
            </nav>`
          : ""
      }
      <div class="sidebar-footer">
        ${
          state.currentUser
            ? `<div class="user-box">
                <span>${escapeHtml(state.currentUser.email)}</span>
                <button class="link-button logout-button" data-action="sign-out">Atsijungti</button>
              </div>`
            : "Prisijunkite, kad matytumėte inventoriaus sistemą."
        }
      </div>
    </aside>
  `;
}

function sidebarItemActive(page) {
  if (state.page === "document-detail" && page === "documents") return true;
  if (state.page === "product-detail" && page === "products") return true;
  if (state.page === "customer-detail" && page === "customers") return true;
  if (state.page === "sales-document-detail" && page === "sales") return true;
  return state.page === page;
}

function renderGlobalSearch() {
  const results = globalSearchResults();
  const hasQuery = state.globalSearchQuery.trim().length >= 2;
  return `
    <div class="global-search">
      <label class="global-search-box">
        <span>⌕</span>
        <input data-global-search value="${escapeHtml(state.globalSearchQuery)}" placeholder="Ieškoti visur" />
      </label>
      ${
        hasQuery
          ? `<div class="global-search-results">
              ${
                results.length
                  ? results.map(renderGlobalSearchResult).join("")
                  : `<div class="global-search-empty">Nerasta</div>`
              }
            </div>`
          : ""
      }
    </div>
  `;
}

function globalSearchResults() {
  const query = state.globalSearchQuery.trim().toLowerCase();
  if (query.length < 2) return [];
  const results = [];

  activeProducts()
    .filter((product) => `${product.article} ${product.name} ${product.manufacturer}`.toLowerCase().includes(query))
    .slice(0, 4)
    .forEach((product) => {
      results.push({
        label: product.article,
        meta: product.name,
        type: "Prekė",
        action: "view-product",
        id: product.id,
      });
    });

  state.customers
    .filter((customer) => `${customer.name} ${customer.companyCode} ${customer.vatCode} ${customer.email}`.toLowerCase().includes(query))
    .slice(0, 4)
    .forEach((customer) => {
      results.push({
        label: customer.name,
        meta: customer.companyCode || customer.email || "Klientas",
        type: "Klientas",
        action: "view-customer",
        id: customer.id,
      });
    });

  state.suppliers
    .filter((supplier) => `${supplier.name} ${supplier.code} ${supplier.email}`.toLowerCase().includes(query))
    .slice(0, 3)
    .forEach((supplier) => {
      results.push({
        label: supplier.name,
        meta: supplier.code || supplier.email || "Tiekėjas",
        type: "Tiekėjas",
        action: "edit-supplier",
        id: supplier.id,
      });
    });

  state.documents
    .filter((document) => `${document.number} ${document.supplierDocumentNumber} ${supplierName(document.supplierId)}`.toLowerCase().includes(query))
    .slice(0, 4)
    .forEach((document) => {
      results.push({
        label: document.number,
        meta: `${supplierName(document.supplierId)} · ${document.status}`,
        type: "Pirkimas",
        action: "view-document",
        id: document.id,
      });
    });

  state.salesDocuments
    .filter((document) => `${document.number} ${customerName(document.customerId)} ${document.customerDocumentNumber}`.toLowerCase().includes(query))
    .slice(0, 4)
    .forEach((document) => {
      results.push({
        label: document.number,
        meta: `${salesTypeLabel(document.type)} · ${customerName(document.customerId)}`,
        type: "Pardavimas",
        action: "view-sales-document",
        id: document.id,
      });
    });

  return results.slice(0, 9);
}

function renderGlobalSearchResult(result) {
  return `
    <button class="global-search-result" data-action="${result.action}" data-id="${result.id}">
      <span>${escapeHtml(result.type)}</span>
      <strong>${escapeHtml(result.label)}</strong>
      <em>${escapeHtml(result.meta)}</em>
    </button>
  `;
}

function renderPage() {
  if (!database.isConfigured || state.page === "database-setup") return renderDatabaseSetupPage();
  if (state.isLoading) return renderLoadingPage();
  if (!state.currentUser) return renderLoginPage();
  if (state.page === "work-center") return renderWorkCenterPage();
  if (state.page === "customers") return renderCustomersPage();
  if (state.page === "customer-detail") return renderCustomerDetailPage();
  if (state.page === "customer-debts") return renderCustomerDebtsPage();
  if (state.page === "sales") return renderSalesPage();
  if (state.page === "new-sales-document") return renderNewSalesDocumentPage();
  if (state.page === "sales-document-detail") return renderSalesDocumentDetailPage();
  if (state.page === "numbering") return renderNumberingPage();
  if (state.page === "vat-registers") return renderVatRegistersPage();
  if (state.page === "isaf-export") return renderIsafExportPage();
  if (state.page === "accounting-settings") return renderAccountingSettingsPage();
  if (state.page === "suppliers") return renderSuppliersPage();
  if (state.page === "documents") return renderDocumentsPage();
  if (state.page === "new-document") return renderNewDocumentPage();
  if (state.page === "document-detail") return renderDocumentDetailPage();
  if (state.page === "product-detail") return renderProductDetailPage();
  if (state.page === "stock-history") return renderStockHistoryPage();
  if (state.page === "price-import") return renderPriceImportPage();
  return renderProductsPage();
}

function renderLoginPage() {
  const isSubmitting = state.isSaving;
  return `
    ${renderHeader("Prisijungimas", "Prisijunkite su Supabase Auth vartotoju.")}
    <section class="document-panel auth-panel">
      <form class="auth-form" data-form="auth-login">
        ${state.errorMessage ? `<div class="auth-message">${escapeHtml(state.errorMessage)}</div>` : ""}
        ${state.authNotice ? `<div class="auth-message success-message">${escapeHtml(state.authNotice)}</div>` : ""}
        <label class="form-field">
          <span class="label">El. paštas</span>
          <input class="input" name="email" type="email" autocomplete="email" required ${isSubmitting ? "disabled" : ""} />
        </label>
        <label class="form-field">
          <span class="label">Slaptažodis</span>
          <input class="input" name="password" type="password" autocomplete="current-password" required ${isSubmitting ? "disabled" : ""} />
        </label>
        <button class="button auth-submit" type="submit" aria-busy="${isSubmitting ? "true" : "false"}" ${isSubmitting ? "disabled" : ""}>
          ${isSubmitting ? `<span class="button-spinner" aria-hidden="true"></span>Jungiamasi...` : "Prisijungti"}
        </button>
      </form>
    </section>
  `;
}

function renderDatabaseSetupPage() {
  return `
    ${renderHeader("Duomenų bazės prijungimas", "Šiam etapui reikalinga Supabase duomenų bazė.")}
    <section class="document-panel">
      <div class="setup-block">
        <h2>Supabase dar neprijungtas</h2>
        <p>Šis projektas yra Vite SPA. Atidarykite <strong>.env.local</strong> ir įrašykite Supabase Project URL bei publishable key.</p>
        <div class="setup-steps">
          <p><strong>1.</strong> Supabase projekte atidarykite SQL Editor.</p>
          <p><strong>2.</strong> Paleiskite failą <strong>scripts/outputs/supabase-schema.sql</strong>.</p>
          <p><strong>3.</strong> Development režime paleiskite <strong>scripts/outputs/supabase-seed.sql</strong>, jeigu norite testinių duomenų.</p>
          <p><strong>4.</strong> Paleiskite <strong>npm run dev</strong>. Duomenys bus kraunami iš Supabase.</p>
        </div>
      </div>
    </section>
  `;
}

function renderLoadingPage() {
  return `
    ${renderHeader("Kraunami duomenys", "Jungiamasi prie Supabase duomenų bazės.")}
    <section class="document-panel">
      <div class="empty-state">Duomenys kraunami...</div>
    </section>
  `;
}

function renderHeader(title, meta, action = "", eyebrow = "Sandėlis") {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${title}</h1>
        <p class="header-meta">${meta}</p>
      </div>
      ${action}
    </header>
  `;
}

function renderMetrics() {
  const products = activeProducts();
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock), 0);
  const lowStock = products.filter((product) => Number(product.stock) <= 5).length;
  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.stock) * Number(product.cost),
    0,
  );
  const drafts = state.documents.filter((document) => document.status === STATUS_DRAFT).length;

  return `
    <section class="summary-grid" aria-label="Santrauka">
      <article class="metric">
        <p class="metric-label">Bendras likutis</p>
        <p class="metric-value">${formatNumber(totalStock)}</p>
      </article>
      <article class="metric">
        <p class="metric-label">Mažas likutis</p>
        <p class="metric-value">${lowStock}</p>
      </article>
      <article class="metric">
        <p class="metric-label">Prekių savikaina</p>
        <p class="metric-value">${formatMoney(totalValue)}</p>
      </article>
      <article class="metric">
        <p class="metric-label">Juodraščiai</p>
        <p class="metric-value">${drafts}</p>
      </article>
    </section>
  `;
}

function metricCard(label, value) {
  return `
    <article class="metric">
      <p class="metric-label">${escapeHtml(label)}</p>
      <p class="metric-value">${escapeHtml(value)}</p>
    </article>
  `;
}

function renderWorkCenterPage() {
  const summary = workCenterSummary();
  const workItems = workCenterItems(summary);
  const latestMovements = state.stockHistory.slice(0, 5);
  const visibleItems = workItems.slice(0, 3);

  return `
    ${renderHeader(
      "Darbo centras",
      "Pradėkite nuo vieno aiškaus veiksmo.",
      "",
      "Šiandien",
    )}
    <section class="work-hero">
      <div class="work-hero-main">
        <p class="work-kicker">Ką daryti dabar</p>
        <h2>${escapeHtml(workItems[0]?.title ?? "Viskas atrodo tvarkingai")}</h2>
        <p>${escapeHtml(workItems[0]?.meta ?? "Galite tęsti nuo naujo dokumento arba peržiūrėti registrus.")}</p>
      </div>
      <div class="work-hero-actions">
        ${renderWorkHeroButton(workItems[0])}
      </div>
    </section>
    <section class="calm-actions" aria-label="Pagrindiniai veiksmai">
      ${calmActionButton("quick-new-invoice", "Parduoti", "Sukurti sąskaitą klientui")}
      ${calmActionButton("prepare-low-stock-receipt", "Papildyti sandėlį", "Sistema paruoš pirkimo juodraštį", summary.lowStock.length === 0)}
      ${calmActionButton("go-customer-debts", "Patikrinti skolas", "Matyti neapmokėtus dokumentus")}
    </section>
    <section class="work-layout">
      <div class="work-column">
        <div class="section-heading">
          <h2>Svarbiausia</h2>
          <span>${visibleItems.length} iš ${workItems.length}</span>
        </div>
        <div class="work-card-grid">
          ${visibleItems.map(renderWorkItemCard).join("")}
        </div>
        <details class="advanced-work-panel">
          <summary>Papildomai</summary>
          <div class="summary-grid compact-summary-grid">
            ${metricCard("Mažas likutis", summary.lowStock.length)}
            ${metricCard("Juodraščiai", summary.draftsTotal)}
            ${metricCard("Klientų skola", formatMoney(summary.debtTotal))}
            ${metricCard("PVM įrašai", summary.monthVatEntries)}
          </div>
          ${renderAutomationPanel(summary)}
        </details>
      </div>
      <aside class="work-side">
        <div class="section-heading">
          <h2>Trumpai</h2>
          <span>Pasirinktinai</span>
        </div>
        <div class="quick-grid">
          ${quickActionButton("quick-new-receipt", "Pajamavimas", "Pirkimo prekės")}
          ${quickActionButton("quick-new-customer", "Klientas", "Nauja kortelė")}
          ${quickActionButton("go-isaf-month", "i.SAF", "Šio mėnesio XML")}
        </div>
        <details class="recent-details">
          <summary>Paskutiniai judėjimai (${latestMovements.length})</summary>
          <div class="recent-list">${renderRecentMovementList(latestMovements)}</div>
        </details>
      </aside>
    </section>
  `;
}

function workCenterSummary() {
  const lowStock = activeProducts().filter(isLowStockProduct);
  const receiptDrafts = state.documents.filter((document) => document.status === STATUS_DRAFT);
  const salesDrafts = state.salesDocuments.filter((document) => document.status === "DRAFT");
  const deliveryDrafts = state.salesDocuments.filter((document) => document.type === "DELIVERY_NOTE" && document.status === "DRAFT");
  const debtRows = customerDebtSummaries();
  const overdueRows = debtRows.filter((row) => row.oldestDueDate && row.oldestDueDate < todayDate());
  const accountingMissing = state.accountingSchemaReady ? missingIsafSettings() : ["buhalterijos SQL"];
  const monthVatEntries = allVatEntries().filter((entry) => entry.date >= monthStartDate() && entry.date <= todayDate()).length;

  return {
    lowStock,
    receiptDrafts,
    salesDrafts,
    deliveryDrafts,
    debtRows,
    overdueRows,
    debtTotal: debtRows.reduce((sum, row) => sum + Number(row.debt || 0), 0),
    draftsTotal: receiptDrafts.length + salesDrafts.length,
    accountingMissing,
    monthVatEntries,
  };
}

function workCenterItems(summary) {
  const items = [];
  if (summary.lowStock.length) {
    items.push({
      tone: "danger",
      title: `${summary.lowStock.length} prekės su mažu likučiu`,
      meta: `${summary.lowStock[0].article} · ${summary.lowStock[0].name}`,
      action: "prepare-low-stock-receipt",
      label: "Paruošti pirkimą",
    });
  }
  if (summary.overdueRows.length) {
    items.push({
      tone: "danger",
      title: `${summary.overdueRows.length} vėluojančios skolos`,
      meta: `Vėluojanti suma: ${formatMoney(summary.overdueRows.reduce((sum, row) => sum + Number(row.overdueDebt || 0), 0))}`,
      action: "prepare-first-debt-reminder",
      label: "Paruošti priminimą",
    });
  }
  if (summary.draftsTotal) {
    items.push({
      tone: "warning",
      title: `${summary.draftsTotal} neužbaigti dokumentai`,
      meta: `Pajamavimai: ${summary.receiptDrafts.length}, pardavimai: ${summary.salesDrafts.length}`,
      action: summary.receiptDrafts.length ? "go-receipt-drafts" : "go-sales-drafts",
      label: "Sutvarkyti",
    });
  }
  if (summary.deliveryDrafts.length) {
    items.push({
      tone: "warning",
      title: `${summary.deliveryDrafts.length} važtaraščiai laukia patvirtinimo`,
      meta: "Patvirtinus mažinamas faktinis sandėlio likutis.",
      action: "go-delivery-drafts",
      label: "Atidaryti važtaraščius",
    });
  }
  if (summary.accountingMissing.length) {
    items.push({
      tone: "warning",
      title: "Neužbaigti i.SAF įmonės duomenys",
      meta: summary.accountingMissing.join(", "),
      action: "go-accounting-settings",
      label: "Užpildyti",
    });
  }
  if (!items.length) {
    items.push({
      tone: "success",
      title: "Šiandien kritinių darbų nėra",
      meta: "Galite kurti naujus dokumentus arba tikrinti mėnesio PVM registrą.",
      action: "go-isaf-month",
      label: "PVM registras",
    });
  }
  return items;
}

function renderWorkHeroButton(item) {
  if (!item) return `<button class="button secondary" data-action="quick-new-receipt">Pradėti</button>`;
  return `<button class="button ${item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : ""}" data-action="${item.action}">${escapeHtml(item.label)}</button>`;
}

function renderWorkItemCard(item) {
  return `
    <article class="work-card ${item.tone}">
      <div>
        <span class="work-status-dot"></span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.meta)}</p>
      </div>
      <button class="button secondary" data-action="${item.action}">${escapeHtml(item.label)}</button>
    </article>
  `;
}

function calmActionButton(action, title, meta, disabled = false) {
  return `
    <button class="calm-action" data-action="${action}" ${disabled ? "disabled" : ""}>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(meta)}</span>
    </button>
  `;
}

function renderAutomationPanel(summary) {
  const closeItems = monthCloseItems(summary);
  const readyCount = closeItems.filter((item) => item.done).length;
  const qualityItems = dataQualityItems();

  return `
    <section class="automation-panel">
      <div class="automation-card primary-automation">
        <div>
          <p class="work-kicker">Autopilotas</p>
          <h2>Sandėlio papildymo juodraštis</h2>
          <p>${summary.lowStock.length ? `${summary.lowStock.length} mažo likučio prekės gali būti sudėtos į pajamavimą automatiškai.` : "Mažo likučio prekių šiuo metu nėra."}</p>
        </div>
        <button class="button" data-action="prepare-low-stock-receipt" ${summary.lowStock.length ? "" : "disabled"}>Paruošti</button>
      </div>
      <div class="automation-card">
        <div class="section-heading compact-heading">
          <h2>Mėnesio uždarymas</h2>
          <span>${readyCount}/${closeItems.length}</span>
        </div>
        <div class="checklist">
          ${closeItems.map(renderChecklistRow).join("")}
        </div>
      </div>
      <div class="automation-card">
        <div class="section-heading compact-heading">
          <h2>Duomenų švara</h2>
          <span>${qualityItems.filter((item) => !item.done).length} taisytina</span>
        </div>
        <div class="checklist">
          ${qualityItems.map(renderChecklistRow).join("")}
        </div>
      </div>
    </section>
  `;
}

function monthCloseItems(summary) {
  return [
    {
      done: !summary.accountingMissing.length,
      label: "Įmonės duomenys",
      meta: summary.accountingMissing.length ? summary.accountingMissing.join(", ") : "Paruošta",
      action: "go-accounting-settings",
    },
    {
      done: summary.draftsTotal === 0,
      label: "Juodraščiai",
      meta: summary.draftsTotal ? `${summary.draftsTotal} neužbaigti` : "Nėra neužbaigtų",
      action: summary.receiptDrafts.length ? "go-receipt-drafts" : "go-sales-drafts",
    },
    {
      done: summary.monthVatEntries > 0,
      label: "PVM registrai",
      meta: `${summary.monthVatEntries} šio mėnesio įrašai`,
      action: "go-vat-month",
    },
    {
      done: summary.monthVatEntries > 0 && !summary.accountingMissing.length,
      label: "i.SAF XML",
      meta: "Rinkmena pagal šį mėnesį",
      action: "go-isaf-month",
    },
  ];
}

function dataQualityItems() {
  const productsWithoutPrice = activeProducts().filter((product) => Number(product.price) <= 0).length;
  const productsWithoutCost = activeProducts().filter((product) => Number(product.cost) <= 0).length;
  const customersWithoutContact = state.customers.filter((customer) => customer.isActive && !customer.email && !customer.phone).length;
  const zeroReceiptDocuments = state.documents.filter((document) => document.status === STATUS_CONFIRMED && Number(document.total) <= 0).length;
  return [
    {
      done: productsWithoutPrice === 0,
      label: "Pardavimo kainos",
      meta: productsWithoutPrice ? `${productsWithoutPrice} prekės be kainos` : "Tvarkinga",
      action: "go-products-no-price",
    },
    {
      done: productsWithoutCost === 0,
      label: "Savikainos",
      meta: productsWithoutCost ? `${productsWithoutCost} prekės be savikainos` : "Tvarkinga",
      action: "go-products-no-cost",
    },
    {
      done: customersWithoutContact === 0,
      label: "Klientų kontaktai",
      meta: customersWithoutContact ? `${customersWithoutContact} be kontakto` : "Tvarkinga",
      action: "go-customers",
    },
    {
      done: zeroReceiptDocuments === 0,
      label: "Pirkimų sumos",
      meta: zeroReceiptDocuments ? `${zeroReceiptDocuments} dokumentai su 0` : "Tvarkinga",
      action: "go-receipts",
    },
  ];
}

function renderChecklistRow(item) {
  return `
    <button class="check-row ${item.done ? "done" : ""}" data-action="${item.action}">
      <span class="check-mark">${item.done ? "✓" : "!"}</span>
      <strong>${escapeHtml(item.label)}</strong>
      <em>${escapeHtml(item.meta)}</em>
    </button>
  `;
}

function quickActionButton(action, title, meta) {
  return `
    <button class="quick-card" data-action="${action}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(meta)}</span>
    </button>
  `;
}

function renderRecentMovementList(movements) {
  return movements.length
    ? movements.map((movement) => `
        <button class="recent-item" data-page="stock-history">
          <span>${escapeHtml(movement.action)}</span>
          <strong>${escapeHtml(movement.article || "-")}</strong>
          <em>${formatNumber(movement.quantity)} ${escapeHtml(movement.unit)}</em>
        </button>
      `).join("")
    : `<div class="compact-empty muted">Likučių judėjimų dar nėra.</div>`;
}

function textField(label, name, value, type = "text") {
  return `
    <label class="form-field">
      <span class="label">${label}</span>
      <input class="input" name="${name}" type="${type}" value="${escapeHtml(value)}" />
    </label>
  `;
}

function renderProductsPage() {
  const products = filteredProducts();
  const visiblePool = productsForCurrentStatus();

  return `
    ${renderHeader(
      "Prekės",
      "Artikulai, likučiai ir kainos mažmeninei vonios įrangos prekybai.",
      `<div class="form-actions">
        <button class="button secondary" data-page="price-import">Įkelti kainininką</button>
        <button class="button" data-action="add-product"><span class="button-icon">+</span>Pridėti prekę</button>
      </div>`,
    )}
    ${renderMetrics()}
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="search">
          <span class="search-icon">⌕</span>
          <input class="input" data-product-search value="${escapeHtml(state.productQuery)}" placeholder="Ieškoti pagal artikulą arba pavadinimą" />
        </label>
        <div class="segmented-control" aria-label="Prekių būsena">
          ${productStatusButton("active", "Aktyvios", activeProducts().length)}
          ${productStatusButton("archived", "Archyvas", archivedProducts().length)}
          ${productStatusButton("all", "Visos", state.products.length)}
        </div>
        <div class="segmented-control" aria-label="Likučio filtras">
          ${productStockButton("all", "Visi likučiai", productsForCurrentStatus().length)}
          ${productStockButton("low", "Mažas likutis", productsForCurrentStatus().filter(isLowStockProduct).length)}
          ${productStockButton("no-price", "Be kainos", productsForCurrentStatus().filter((product) => Number(product.price) <= 0).length)}
          ${productStockButton("no-cost", "Be savikainos", productsForCurrentStatus().filter((product) => Number(product.cost) <= 0).length)}
        </div>
      </div>
      <div class="toolbar-right muted" data-products-count>${products.length} iš ${visiblePool.length}</div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table class="products-table">
          <thead>
            <tr>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Gamintojas</th>
              <th>Kategorija</th>
              <th>Sandėlis</th>
              <th class="num">Likutis</th>
              <th class="num">Savikaina</th>
              <th class="num">Pardavimo kaina</th>
              <th class="num">PVM</th>
              <th>Būsena</th>
              <th class="actions-cell"></th>
            </tr>
          </thead>
          <tbody data-products-body>
            ${renderProductsRows(products)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPriceImportPage() {
  const summary = priceImportSummary();
  const canApply = summary.update > 0 || summary.create > 0;

  return `
    ${renderHeader(
      "Kainininkai",
      "Įkelkite gamintojo Excel, CSV arba TXT kainininką su prekių kodais ir atnaujinkite kainas per peržiūrą.",
      `<button class="button secondary" data-action="download-price-template">Atsisiųsti šabloną</button>`,
      "Prekės",
    )}
    <section class="summary-grid price-import-summary" aria-label="Kainininko santrauka">
      ${metricCard("Eilučių", String(summary.total))}
      ${metricCard("Atnaujins", String(summary.update))}
      ${metricCard("Sukurs", String(summary.create))}
      ${metricCard("Praleis", String(summary.skip))}
    </section>
    <section class="document-panel price-import-panel">
      <div class="price-import-layout">
        <div class="price-import-inputs">
          <label class="form-field">
            <span class="label">Gamintojo kainininko failas</span>
            <span class="file-upload-control">
              <span class="file-upload-button">Pasirinkti failą</span>
              <span class="file-upload-text">Excel, CSV arba TXT kainininkas</span>
              <input class="file-input" data-price-import-file type="file" accept=".xlsx,.xls,.xlsm,.ods,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values,text/plain" />
            </span>
          </label>
          <label class="form-field">
            <span class="label">Arba įklijuokite lentelę</span>
            <textarea class="input textarea price-import-textarea" data-price-import-text rows="12" placeholder="Artikulas;Pavadinimas;Gamintojas;Savikaina;Pardavimo kaina;PVM">${escapeHtml(state.priceImport.text)}</textarea>
          </label>
          ${renderPriceImportMapping()}
        </div>
        <div class="price-import-options">
          <h2>Ką atnaujinti</h2>
          ${priceImportOption("updateCost", "Savikainą")}
          ${priceImportOption("updatePrice", "Pardavimo kainą")}
          ${priceImportOption("updateVat", "PVM tarifą")}
          ${priceImportOption("updateName", "Pavadinimą")}
          ${priceImportOption("updateManufacturer", "Gamintoją")}
          ${priceImportOption("createMissing", "Sukurti prekes, kurių dar nėra sąraše")}
          <div class="auth-message import-note">
            Sistema priima Excel, CSV ir nukopijuotą lentelę. Atpažįstami dažni stulpeliai: artikulas, kodas, SKU, pavadinimas, gamintojas, savikaina, pardavimo kaina, price, VAT.
          </div>
        </div>
      </div>
      <div class="form-actions price-import-actions">
        <button class="button secondary" data-action="clear-price-import">Išvalyti</button>
        <button class="button secondary" data-action="parse-price-import">Nuskaityti</button>
        <button class="button" data-action="apply-price-import" ${canApply ? "" : "disabled"}>Atnaujinti prekes</button>
      </div>
      ${renderPriceImportErrors()}
    </section>
    <section class="table-panel price-import-preview">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Būsena</th>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Gamintojas</th>
              <th class="num">Savikaina</th>
              <th class="num">Pardavimo kaina</th>
              <th class="num">PVM</th>
              <th>Pakeitimai</th>
            </tr>
          </thead>
          <tbody>
            ${renderPriceImportRows()}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPriceImportMapping() {
  if (!state.priceImport.headers.length) return "";
  return `
    <div class="price-import-mapping">
      <div>
        <h2>Stulpelių priskyrimas</h2>
        <p class="muted small-text">Jeigu gamintojo kainininkas kitoks, čia pataisykite, kuris stulpelis kur turi keliauti. GTIN / EAN čia paprastai nereikia rinktis.</p>
      </div>
      <div class="mapping-grid">
        ${priceImportColumnSelect("article", "Artikulas / prekės kodas", true)}
        ${priceImportColumnSelect("name", "Pavadinimas")}
        ${priceImportColumnSelect("manufacturer", "Gamintojas / brand")}
        ${priceImportColumnSelect("cost", "Savikaina / pirkimo kaina")}
        ${priceImportColumnSelect("price", "Pardavimo kaina be PVM")}
        ${priceImportColumnSelect("vat", "PVM tarifas")}
      </div>
    </div>
  `;
}

function priceImportColumnSelect(field, label, required = false) {
  return `
    <label class="form-field compact-field">
      <span class="label">${escapeHtml(label)}${required ? " *" : ""}</span>
      <select class="select" data-price-import-column="${field}">
        <option value="-1">Nenaudoti</option>
        ${state.priceImport.headers
          .map((header, index) => `<option value="${index}" ${Number(state.priceImport.columns[field]) === index ? "selected" : ""}>${index + 1}. ${escapeHtml(header || `Stulpelis ${index + 1}`)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function priceImportOption(name, label) {
  return `
    <label class="checkbox-field import-checkbox">
      <input type="checkbox" data-price-import-option="${name}" ${state.priceImport.options[name] ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function renderPriceImportErrors() {
  if (!state.priceImport.errors.length) return "";
  return `
    <div class="auth-message import-errors">
      ${state.priceImport.errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("")}
    </div>
  `;
}

function renderPriceImportRows() {
  const rows = state.priceImport.rows;
  if (!rows.length) {
    return `<tr><td colspan="8"><div class="empty-state">Įkelkite kainininką ir paspauskite „Nuskaityti“. Čia matysite, kurios prekės bus atnaujintos.</div></td></tr>`;
  }

  const previewRows = rows.slice(0, 150);
  const hiddenCount = rows.length - previewRows.length;
  return `
    ${previewRows
      .map(
        (row) => `
          <tr>
            <td>${renderPriceImportStatus(row)}</td>
            <td><strong>${escapeHtml(row.article || "-")}</strong></td>
            <td>${escapeHtml(row.name || row.existingProduct?.name || "-")}</td>
            <td>${escapeHtml(row.manufacturer || row.existingProduct?.manufacturer || "-")}</td>
            <td class="num">${row.cost === null ? "-" : formatMoney(row.cost)}</td>
            <td class="num">${row.price === null ? "-" : formatMoney(row.price)}</td>
            <td class="num">${row.vat === null ? "-" : `${formatNumber(row.vat)} %`}</td>
            <td>${renderPriceImportChanges(row)}</td>
          </tr>
        `,
      )
      .join("")}
    ${
      hiddenCount > 0
        ? `<tr><td colspan="8"><div class="empty-state">Rodoma pirmos 150 eilučių. Dar ${hiddenCount} eil. bus pritaikytos paspaudus atnaujinimą.</div></td></tr>`
        : ""
    }
  `;
}

function renderPriceImportStatus(row) {
  const className = row.status === "update" ? "success" : row.status === "create" ? "warning" : "danger";
  const label = row.status === "update" ? "Atnaujins" : row.status === "create" ? "Sukurs" : "Praleis";
  return `<span class="badge ${className}">${label}</span>`;
}

function renderPriceImportChanges(row) {
  if (row.changes.length) {
    return `<div class="import-change-list">${row.changes.map((change) => `<span>${escapeHtml(change)}</span>`).join("")}</div>`;
  }
  return `<span class="muted">${escapeHtml(row.reason || "Pakeitimų nėra")}</span>`;
}

function productStatusButton(value, label, count) {
  return `
    <button class="segment-button ${state.productStatusFilter === value ? "active" : ""}" data-action="set-product-status-filter" data-status="${value}">
      ${label} <span>${count}</span>
    </button>
  `;
}

function productStockButton(value, label, count) {
  return `
    <button class="segment-button ${state.productStockFilter === value ? "active" : ""}" data-action="set-product-stock-filter" data-stock-filter="${value}">
      ${label} <span>${count}</span>
    </button>
  `;
}

function filteredProducts() {
  const query = state.productQuery.trim().toLowerCase();
  return productsForCurrentStatus().filter((product) => {
    return (
      productMatchesStockFilter(product) &&
      (product.article.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query))
    );
  });
}

function productMatchesStockFilter(product) {
  if (state.productStockFilter === "low") return isLowStockProduct(product);
  if (state.productStockFilter === "no-price") return Number(product.price) <= 0;
  if (state.productStockFilter === "no-cost") return Number(product.cost) <= 0;
  return true;
}

function activeProducts() {
  return state.products.filter((product) => product.isActive !== false);
}

function archivedProducts() {
  return state.products.filter((product) => product.isActive === false);
}

function productsForCurrentStatus() {
  if (state.productStatusFilter === "archived") return archivedProducts();
  if (state.productStatusFilter === "all") return state.products;
  return activeProducts();
}

function priceImportSummary() {
  return state.priceImport.rows.reduce(
    (summary, row) => {
      summary.total += 1;
      if (row.status === "update") summary.update += 1;
      if (row.status === "create") summary.create += 1;
      if (row.status === "skip") summary.skip += 1;
      return summary;
    },
    { total: 0, update: 0, create: 0, skip: 0 },
  );
}

async function readPriceImportFile(file) {
  if (isSpreadsheetImportFile(file)) {
    return readSpreadsheetImportFile(file);
  }
  return file.text();
}

function isSpreadsheetImportFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["xlsx", "xls", "xlsm", "ods"].includes(extension);
}

async function readSpreadsheetImportFile(file) {
  const xlsx = await loadSpreadsheetImportLibrary();
  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) throw new Error("Excel faile nerasta lapų.");
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_csv(sheet, { FS: ";", RS: "\n", blankrows: false });
}

async function loadSpreadsheetImportLibrary() {
  if (window.XLSX) return window.XLSX;
  if (!spreadsheetImportLibraryPromise) {
    spreadsheetImportLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SPREADSHEET_IMPORT_LIBRARY_URL;
      script.async = true;
      script.onload = () => {
        if (window.XLSX) resolve(window.XLSX);
        else reject(new Error("Excel skaitymo modulis neįsikėlė."));
      };
      script.onerror = () => reject(new Error("Nepavyko įkelti Excel skaitymo modulio. Patikrinkite interneto ryšį arba įkelkite CSV failą."));
      document.head.appendChild(script);
    });
  }
  return spreadsheetImportLibraryPromise;
}

function parseCurrentPriceImport({ notify = false, preserveColumns = false } = {}) {
  const text = state.priceImport.text.trim();
  if (!text) {
    state.priceImport.rows = [];
    state.priceImport.errors = ["Įkelkite arba įklijuokite kainininko tekstą."];
    if (notify) setToast("Įkelkite kainininką.");
    return;
  }

  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    state.priceImport.rows = [];
    state.priceImport.errors = ["Kainininko faile nerasta eilučių."];
    return;
  }

  const detected = preserveColumns && state.priceImport.headers.length
    ? {
        delimiter: state.priceImport.delimiter,
        headerLineIndex: state.priceImport.headerLineIndex,
        headers: state.priceImport.headers,
        columns: state.priceImport.columns,
        hasHeader: state.priceImport.headerLineIndex >= 0,
      }
    : detectPriceImportTable(lines);
  const columns = detected.columns;
  const dataLines = detected.hasHeader ? lines.slice(detected.headerLineIndex + 1) : lines;
  const errors = [];

  state.priceImport.delimiter = detected.delimiter;
  state.priceImport.headerLineIndex = detected.headerLineIndex;
  state.priceImport.headers = detected.headers;
  state.priceImport.columns = { ...blankPriceImport().columns, ...columns };

  if (!detected.hasHeader) {
    errors.push("Stulpelių pavadinimų nerasta. Pasirinkite stulpelius rankiniu būdu arba naudokite šabloną.");
  }

  if (columns.article < 0) {
    state.priceImport.rows = [];
    state.priceImport.errors = ["Pasirinkite, kuris stulpelis yra artikulas / prekės kodas."];
    return;
  }

  const productByCode = new Map(state.products.map((product) => [normalizeArticle(product.article), product]));
  const rows = dataLines
    .map((line, index) => parsePriceImportRow(line, detected.delimiter, state.priceImport.columns, productByCode, index + (detected.hasHeader ? detected.headerLineIndex + 2 : 1)))
    .filter(Boolean);

  const duplicateArticles = findDuplicateImportArticles(rows);
  duplicateArticles.forEach((article) => errors.push(`Kainininke kartojasi artikulas ${article}. Bus naudojama kiekviena eilutė iš eilės.`));

  state.priceImport.rows = rows;
  state.priceImport.errors = errors;
  if (notify) {
    const summary = priceImportSummary();
    setToast(`Nuskaityta: ${summary.update} atnaujins, ${summary.create} sukurs, ${summary.skip} praleis.`);
  }
}

function detectPriceImportDelimiter(line) {
  return [";", "\t", ",", "|"]
    .map((delimiter) => ({ delimiter, columns: parseDelimitedLine(line, delimiter).length }))
    .sort((left, right) => right.columns - left.columns)[0].delimiter;
}

function detectPriceImportTable(lines) {
  const candidates = [];
  [";", "\t", ",", "|"].forEach((delimiter) => {
    lines.slice(0, 30).forEach((line, index) => {
      const headers = parseDelimitedLine(line, delimiter).map(cleanImportCell);
      if (headers.length < 2) return;
      const columns = detectPriceImportColumns(headers);
      candidates.push({
        delimiter,
        headerLineIndex: index,
        headers,
        columns,
        score: priceImportHeaderScore(columns, headers),
      });
    });
  });

  const best = candidates.sort((left, right) => right.score - left.score || right.headers.length - left.headers.length)[0];
  if (best && best.score >= 8) {
    return { ...best, hasHeader: true };
  }

  const delimiter = detectPriceImportDelimiter(lines[0]);
  const firstHeaders = parseDelimitedLine(lines[0], delimiter).map(cleanImportCell);
  return {
    delimiter,
    headerLineIndex: 0,
    headers: firstHeaders,
    columns: { ...blankPriceImport().columns, article: -1 },
    hasHeader: false,
  };
}

function priceImportHeaderScore(columns, headers) {
  let score = 0;
  if (columns.article >= 0) score += 6;
  if (columns.name >= 0) score += 4;
  if (columns.price >= 0) score += 4;
  if (columns.cost >= 0) score += 3;
  if (columns.manufacturer >= 0) score += 2;
  if (columns.vat >= 0) score += 1;
  if (headers.some((header) => importHeaderLooksLikeBarcode(header))) score += 1;
  return score;
}

function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (character === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  cells.push(current);
  return cells;
}

function detectPriceImportColumns(headers) {
  const columns = {
    article: importColumnIndex(headers, ["artikulas", "prekes kodas", "prekės kodas", "gaminio kodas", "gamintojo kodas", "code no", "code nr", "item no", "sku", "article", "article code", "article_code", "product code", "item code", "code"], ["gtin", "ean", "barcode", "bar code", "bruksninis kodas", "brūkšninis kodas"]),
    name: importColumnIndex(headers, ["pavadinimas", "preke", "prekė", "prekes pavadinimas", "prekės pavadinimas", "name", "product name", "description", "aprasymas", "aprašymas"]),
    manufacturer: importColumnIndex(headers, ["gamintojas", "brand", "manufacturer", "producer", "tiekejas", "tiekėjas"]),
    category: importColumnIndex(headers, ["kategorija", "category", "group", "grupe", "grupė"]),
    cost: importColumnIndex(headers, ["savikaina", "pirkimo kaina", "purchase price", "purchase_price", "cost", "net cost", "didmenine kaina", "didmeninė kaina", "wholesale price"], ["mazmenine", "mažmeninė", "retail", "rrp"]),
    price: priceImportPriceColumnIndex(headers),
    vat: priceImportVatColumnIndex(headers),
    unit: importColumnIndex(headers, ["vnt", "vnt.", "matas", "vienetas", "unit", "unit of measure"]),
  };

  if (columns.cost === columns.price && columns.cost >= 0) {
    const header = normalizeImportText(headers[columns.cost]);
    if (header.includes("purchase") || header.includes("pirkimo") || header.includes("savikaina") || header.includes("cost") || header.includes("wholesale") || header.includes("didmen")) {
      columns.price = -1;
    } else if (header.includes("sale") || header.includes("pardavimo") || header.includes("retail") || header.includes("rrp") || header.includes("rekomenduoj")) {
      columns.cost = -1;
    }
  }

  return columns;
}

function priceImportPriceColumnIndex(headers) {
  const withoutVat = importColumnIndex(headers, ["mazmenine kaina be pvm", "mažmeninė kaina be pvm", "pardavimo kaina be pvm", "kaina be pvm", "price excl vat", "price without vat", "net retail price"]);
  if (withoutVat >= 0) return withoutVat;
  return importColumnIndex(headers, ["pardavimo kaina", "sale price", "sale_price", "retail price", "recommended price", "rekomenduojama kaina", "rrp", "price", "mazmenine kaina", "mažmeninė kaina", "kaina"], ["savikaina", "pirkimo", "purchase", "cost", "didmenine", "didmeninė", "wholesale", "gtin", "ean", "barcode"]);
}

function priceImportVatColumnIndex(headers) {
  return importColumnIndex(headers, ["pvm tarifas", "vat rate", "vat_rate", "pvm %", "vat %", "pvm", "vat"], ["kaina", "price", "amount", "suma", "su pvm", "be pvm", "with vat", "without vat"]);
}

function importColumnIndex(headers, aliases, excludedAliases = []) {
  const normalizedHeaders = headers.map(normalizeImportText);
  const normalizedAliases = aliases.map(normalizeImportText);
  const normalizedExcluded = excludedAliases.map(normalizeImportText);
  const candidates = normalizedHeaders.map((header, index) => {
    if (!header) return { index, score: 0 };
    if (normalizedExcluded.some((alias) => header === alias || header.includes(alias))) return { index, score: 0 };
    const score = normalizedAliases.reduce((best, alias) => {
      if (!alias) return best;
      if (header === alias) return Math.max(best, 100);
      if (header.includes(alias)) return Math.max(best, 70 - Math.max(0, header.length - alias.length));
      if (alias.includes(header) && header.length >= 4) return Math.max(best, 35);
      return best;
    }, 0);
    return { index, score };
  });
  const best = candidates.sort((left, right) => right.score - left.score)[0];
  return best && best.score > 0 ? best.index : -1;
}

function importHeaderLooksLikeBarcode(header) {
  const normalized = normalizeImportText(header);
  return ["gtin", "ean", "barcode", "bar code", "bruksninis kodas", "brūkšninis kodas"].some((alias) =>
    normalized.includes(normalizeImportText(alias)),
  );
}

function parsePriceImportRow(line, delimiter, columns, productByCode, lineNumber) {
  const cells = parseDelimitedLine(line, delimiter).map(cleanImportCell);
  const article = cellAt(cells, columns.article);
  const row = {
    lineNumber,
    article,
    name: cellAt(cells, columns.name),
    manufacturer: cellAt(cells, columns.manufacturer),
    category: cellAt(cells, columns.category),
    unit: cellAt(cells, columns.unit) || "vnt.",
    cost: parseImportMoney(cellAt(cells, columns.cost)),
    price: parseImportMoney(cellAt(cells, columns.price)),
    vat: parseImportMoney(cellAt(cells, columns.vat)),
    status: "skip",
    reason: "",
    changes: [],
    existingProduct: null,
  };

  const validationMessage = priceImportRowValidationMessage(row);
  if (validationMessage) {
    row.reason = validationMessage;
    return row;
  }

  if (!row.article) {
    row.reason = `${lineNumber} eilutėje nėra artikulo.`;
    return row;
  }

  row.existingProduct = productByCode.get(normalizeArticle(row.article)) ?? null;
  if (!row.existingProduct && !state.priceImport.options.createMissing) {
    row.reason = "Prekė nerasta. Įjunkite kūrimą, jeigu ją reikia pridėti.";
    return row;
  }

  if (!row.existingProduct && state.priceImport.options.createMissing && !row.name) {
    row.reason = "Naujai prekei reikia pavadinimo.";
    return row;
  }

  if (!row.existingProduct && state.priceImport.options.createMissing && row.cost === null && row.price === null) {
    row.reason = "Nauja prekė praleista, nes nėra savikainos arba pardavimo kainos.";
    return row;
  }

  row.changes = buildPriceImportChanges(row, row.existingProduct);
  if (!row.changes.length) {
    row.reason = row.existingProduct ? "Kainos ir pasirinkti laukai jau sutampa." : "Nėra ką sukurti.";
    return row;
  }

  row.status = row.existingProduct ? "update" : "create";
  return row;
}

function priceImportRowValidationMessage(row) {
  if (!row.article) return "";
  const article = String(row.article).trim();
  if (/^\d{12,14}$/.test(article)) {
    return "Šis kodas atrodo kaip GTIN/EAN, ne prekės artikulas. Pasirinkite gamintojo prekės kodo stulpelį.";
  }
  if (/^\d{1,3}$/.test(article) && row.name && normalizeArticle(row.name) === normalizeArticle(article)) {
    return "Artikulas ir pavadinimas atrodo kaip eilutės numeris, todėl eilutė praleista.";
  }
  if (row.cost !== null && !isSafeImportMoney(row.cost)) {
    return "Savikainos stulpelyje rastas per didelis arba netinkamas skaičius. Patikrinkite stulpelių priskyrimą.";
  }
  if (row.price !== null && !isSafeImportMoney(row.price)) {
    return "Pardavimo kainos stulpelyje rastas per didelis arba netinkamas skaičius. Patikrinkite stulpelių priskyrimą.";
  }
  if (row.vat !== null && (row.vat < 0 || row.vat > 100)) {
    return "PVM stulpelyje rastas netinkamas skaičius. Patikrinkite, ar nepasirinktas kainos arba GTIN stulpelis.";
  }
  return "";
}

function isSafeImportMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1000000;
}

function buildPriceImportChanges(row, existingProduct) {
  const changes = [];
  const options = state.priceImport.options;

  if (!existingProduct) {
    changes.push("Nauja prekė");
    if (row.cost !== null) changes.push(`Savikaina ${formatMoney(row.cost)}`);
    if (row.price !== null) changes.push(`Pardavimo kaina ${formatMoney(row.price)}`);
    if (row.vat !== null) changes.push(`PVM ${formatNumber(row.vat)} %`);
    return changes;
  }

  if (options.updateCost && row.cost !== null && !sameImportNumber(existingProduct.cost, row.cost)) {
    changes.push(`Savikaina ${formatMoney(existingProduct.cost)} -> ${formatMoney(row.cost)}`);
  }
  if (options.updatePrice && row.price !== null && !sameImportNumber(existingProduct.price, row.price)) {
    changes.push(`Pardavimo kaina ${formatMoney(existingProduct.price)} -> ${formatMoney(row.price)}`);
  }
  if (options.updateVat && row.vat !== null && !sameImportNumber(existingProduct.vat, row.vat)) {
    changes.push(`PVM ${formatNumber(existingProduct.vat)} % -> ${formatNumber(row.vat)} %`);
  }
  if (options.updateName && row.name && row.name !== existingProduct.name) {
    changes.push(`Pavadinimas: ${existingProduct.name} -> ${row.name}`);
  }
  if (options.updateManufacturer && row.manufacturer && row.manufacturer !== existingProduct.manufacturer) {
    changes.push(`Gamintojas: ${existingProduct.manufacturer || "-"} -> ${row.manufacturer}`);
  }

  return changes;
}

function findDuplicateImportArticles(rows) {
  const seen = new Set();
  const duplicates = new Set();
  rows.forEach((row) => {
    const article = normalizeArticle(row.article);
    if (!article) return;
    if (seen.has(article)) duplicates.add(row.article);
    seen.add(article);
  });
  return [...duplicates];
}

function cleanImportCell(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function cellAt(cells, index) {
  if (index < 0 || index === undefined) return "";
  return cleanImportCell(cells[index]);
}

function normalizeArticle(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeImportText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseImportMoney(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let normalized = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!normalized || normalized === "-" || normalized === "." || normalized === ",") return null;
  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");
  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized = commaIndex > dotIndex
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(",", ".");
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function sameImportNumber(left, right) {
  return Math.abs((Number(left) || 0) - (Number(right) || 0)) < 0.0001;
}

async function applyPriceImport() {
  parseCurrentPriceImport({ preserveColumns: state.priceImport.headers.length > 0 });
  const rows = state.priceImport.rows.filter((row) => row.status === "update" || row.status === "create");
  if (!rows.length) {
    setToast("Nėra kainų pakeitimų, kuriuos reikėtų pritaikyti.");
    return;
  }

  await runSaving(async () => {
    let updated = 0;
    let created = 0;
    for (const row of rows) {
      const existingProduct = state.products.find((product) => normalizeArticle(product.article) === normalizeArticle(row.article));
      const product = priceImportProductPayload(row, existingProduct);
      const savedProduct = await database.saveProduct(product);
      upsert(state.products, savedProduct);
      if (existingProduct) updated += 1;
      else created += 1;
    }
    await reloadAllData();
    parseCurrentPriceImport();
    setToast(`Kainininkas pritaikytas: atnaujinta ${updated}, sukurta ${created}.`);
  });
}

function priceImportProductPayload(row, existingProduct) {
  const options = state.priceImport.options;
  if (!existingProduct) {
    return {
      id: null,
      article: row.article,
      name: row.name || row.article,
      manufacturer: row.manufacturer || "",
      category: row.category || "",
      warehouse: "Vilnius",
      stock: 0,
      minimumStock: 0,
      unit: row.unit || "vnt.",
      cost: row.cost ?? 0,
      price: row.price ?? 0,
      vat: row.vat ?? 21,
      notes: "",
      isActive: true,
    };
  }

  return {
    ...existingProduct,
    cost: options.updateCost && row.cost !== null ? row.cost : existingProduct.cost,
    price: options.updatePrice && row.price !== null ? row.price : existingProduct.price,
    vat: options.updateVat && row.vat !== null ? row.vat : existingProduct.vat,
    name: options.updateName && row.name ? row.name : existingProduct.name,
    manufacturer: options.updateManufacturer && row.manufacturer ? row.manufacturer : existingProduct.manufacturer,
  };
}

function resetPriceImport() {
  state.priceImport = blankPriceImport();
}

function downloadPriceTemplate() {
  const rows = [
    ["Artikulas", "Pavadinimas", "Gamintojas", "Savikaina", "Pardavimo kaina", "PVM"],
    ["MIX-1001", "Praustuvo maišytuvas", "Hansgrohe", "70,00", "109,00", "21"],
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  downloadTextFile("kainininko-sablonas.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
}

function isLowStockProduct(product) {
  const threshold = Math.max(5, Number(product.minimumStock) || 0);
  return freeStockForProduct(product) <= threshold;
}

function renderProductsRows(products) {
  return products.length
    ? products
        .map((product) => {
          const deleteBlocked = Boolean(productDeleteBlockMessage(product));
          return `
            <tr>
              <td><strong>${escapeHtml(product.article)}</strong></td>
              <td>${escapeHtml(product.name)}</td>
              <td>${escapeHtml(product.manufacturer)}</td>
              <td>${escapeHtml(product.category)}</td>
              <td>${escapeHtml(product.warehouse)}</td>
              <td class="num">${renderProductStockCell(product)}</td>
              <td class="num">${formatMoney(product.cost)}</td>
              <td class="num">${formatMoney(product.price)}</td>
              <td class="num">${formatNumber(product.vat)} %</td>
              <td>${renderAvailabilityBadge(product.isActive !== false ? "Aktyvi" : "Archyve", product.isActive !== false)}</td>
              <td class="actions-cell">
                <div class="action-group">
                  <button class="link-button" data-action="view-product" data-id="${product.id}">Peržiūrėti</button>
                  <button class="link-button" data-action="edit-product" data-id="${product.id}">Redaguoti</button>
                  ${
                    product.isActive === false
                      ? `<button class="link-button" data-action="restore-product" data-id="${product.id}">Grąžinti</button>`
                      : `<button class="link-button danger-link" data-action="delete-product" data-id="${product.id}" ${deleteBlocked ? `disabled title="${escapeHtml(productDeleteBlockMessage(product))}"` : ""}>Pašalinti</button>`
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="11"><div class="empty-state">Nerasta prekių pagal pasirinktą paiešką.</div></td></tr>`;
}

function renderAvailabilityBadge(label, isActive) {
  return `<span class="badge ${isActive ? "success" : "warning"}">${escapeHtml(label)}</span>`;
}

function renderProductStockCell(product) {
  const freeStock = freeStockForProduct(product);
  const className = isLowStockProduct(product) ? "stock-chip low" : "stock-chip";
  return `
    <span class="${className}">
      ${formatNumber(product.stock)} ${escapeHtml(product.unit)}
      ${freeStock !== Number(product.stock) ? `<em>Laisva ${formatNumber(freeStock)}</em>` : ""}
    </span>
  `;
}

function renderProductDetailPage() {
  const product = findProduct(state.selectedProductId);
  if (!product) {
    return `
      ${renderHeader("Prekė nerasta", "Pasirinkta prekės kortelė nebeegzistuoja.")}
      <button class="button secondary" data-action="back-to-products">Grįžti į prekių sąrašą</button>
    `;
  }

  const history = stockHistoryForProduct(product);
  const reserved = reservedQuantityForProduct(product.id);
  const freeStock = freeStockForProduct(product);
  const deleteBlockedMessage = productDeleteBlockMessage(product);

  return `
    ${renderHeader(
      product.article,
      "Prekės kortelė ir jos likučio judėjimas.",
      `<div class="form-actions">
        <button class="button secondary" data-action="back-to-products">Grįžti į sąrašą</button>
        <button class="button" data-action="edit-product" data-id="${product.id}">Redaguoti</button>
        ${
          product.isActive === false
            ? `<button class="button" data-action="restore-product" data-id="${product.id}">Grąžinti į aktyvias</button>`
            : `<button class="button danger" data-action="delete-product" data-id="${product.id}" ${deleteBlockedMessage ? `disabled title="${escapeHtml(deleteBlockedMessage)}"` : ""}>Pašalinti</button>`
        }
      </div>`,
    )}
    <section class="document-panel">
      <div class="detail-grid product-detail-grid">
        ${detailItem("Kodas", escapeHtml(product.article))}
        ${detailItem("Pavadinimas", escapeHtml(product.name))}
        ${detailItem("Gamintojas", escapeHtml(product.manufacturer))}
        ${detailItem("Kategorija", escapeHtml(product.category || "-"))}
        ${detailItem("Savikaina", formatMoney(product.cost))}
        ${detailItem("Pardavimo kaina", formatMoney(product.price))}
        ${detailItem("PVM", `${formatNumber(product.vat)} %`)}
        ${detailItem("Būsena", product.isActive === false ? "Archyve" : "Aktyvi")}
        ${detailItem("Faktinis likutis", `${formatNumber(product.stock)} ${escapeHtml(product.unit)}`)}
        ${detailItem("Rezervuota", `${formatNumber(reserved)} ${escapeHtml(product.unit)}`)}
        ${detailItem("Laisvas likutis", `${formatNumber(freeStock)} ${escapeHtml(product.unit)}`)}
      </div>
      <div class="lines-header">
        <h2>Likučio istorija</h2>
      </div>
      <div class="table-scroll">
        <table class="stock-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Dokumentas</th>
              <th>Veiksmas</th>
              <th class="num">Kiekis</th>
              <th class="num">Likutis prieš</th>
              <th class="num">Likutis po</th>
            </tr>
          </thead>
          <tbody>
            ${renderStockHistoryRows(history, true)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStockHistoryPage() {
  const history = filteredStockHistory();

  return `
    ${renderHeader("Likučių istorija", "Visi pajamavimo ir atšaukimo veiksmai, keičiantys prekių likučius.")}
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="search">
          <span class="search-icon">⌕</span>
          <input class="input" data-stock-history-search value="${escapeHtml(state.stockHistoryQuery)}" placeholder="Ieškoti pagal dokumentą, kodą arba pavadinimą" />
        </label>
      </div>
      <div class="toolbar-right muted">${history.length} įrašai</div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table class="stock-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Dokumentas</th>
              <th>Prekė</th>
              <th>Veiksmas</th>
              <th class="num">Kiekis</th>
              <th class="num">Likutis prieš</th>
              <th class="num">Likutis po</th>
            </tr>
          </thead>
          <tbody>
            ${renderStockHistoryRows(history)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function filteredStockHistory() {
  const query = state.stockHistoryQuery.trim().toLowerCase();
  return state.stockHistory
    .filter((entry) => {
      if (!query) return true;
      return (
        entry.documentNumber.toLowerCase().includes(query) ||
        entry.article.toLowerCase().includes(query) ||
        entry.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function stockHistoryForProduct(product) {
  return state.stockHistory
    .filter((entry) => idsEqual(entry.productId, product.id) || entry.article === product.article)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function productHasSalesHistory(product) {
  return stockHistoryForProduct(product).some(isSaleStockMovement) || salesDocumentsForProduct(product).some(isFinalizedSaleDocument);
}

function isSaleStockMovement(entry) {
  const movementType = String(entry.movementType ?? "").toUpperCase();
  const referenceType = String(entry.referenceType ?? "").toUpperCase();
  const action = String(entry.action ?? "").toLowerCase();
  const comment = String(entry.comment ?? "").toLowerCase();
  const text = `${movementType} ${referenceType} ${action} ${comment}`.toLowerCase();

  if (movementType === "RECEIPT_CANCEL" || action.includes("atšauk")) return false;
  return text.includes("sale") || text.includes("sold") || text.includes("pardav") || Number(entry.quantity) < 0;
}

function salesDocumentsForProduct(product) {
  return state.salesDocuments.filter((document) =>
    document.lines.some((line) => idsEqual(line.productId, product.id) || line.article === product.article),
  );
}

function isFinalizedSaleDocument(document) {
  return ["INVOICE", "DELIVERY_NOTE"].includes(document.type) && !["DRAFT", "CANCELLED"].includes(document.status);
}

function productDeleteBlockMessage(product) {
  if (!productHasSalesHistory(product)) return "";
  return `Prekės ${product.article} pašalinti negalima, nes ji turi pardavimo istoriją.`;
}

function renderStockHistoryRows(history, compact = false) {
  if (!history.length) {
    return `<tr><td colspan="${compact ? 6 : 7}"><div class="empty-state">Likučių istorijos įrašų nėra.</div></td></tr>`;
  }

  return history
    .map(
      (entry) => `
        <tr>
          <td>${formatDateTime(entry.date)}</td>
          <td>
            <button class="link-button" data-action="${stockMovementDocumentAction(entry)}" data-id="${entry.documentId}">${escapeHtml(entry.documentNumber)}</button>
          </td>
          ${
            compact
              ? ""
              : `<td><button class="plain-link" data-action="view-product" data-id="${entry.productId}">${escapeHtml(entry.article)} · ${escapeHtml(entry.name)}</button></td>`
          }
          <td>${escapeHtml(entry.action)}</td>
          <td class="num">${entry.quantity > 0 ? "+" : ""}${formatNumber(entry.quantity)} ${escapeHtml(entry.unit)}</td>
          <td class="num">${formatNumber(entry.beforeStock)} ${escapeHtml(entry.unit)}</td>
          <td class="num">${formatNumber(entry.afterStock)} ${escapeHtml(entry.unit)}</td>
        </tr>
      `,
    )
    .join("");
}

function stockMovementDocumentAction(entry) {
  const referenceType = String(entry.referenceType ?? "").toUpperCase();
  const isSalesMovement = referenceType.includes("SALES") || state.salesDocuments.some((document) => idsEqual(document.id, entry.documentId));
  return isSalesMovement ? "view-sales-document" : "view-document";
}

function renderCustomersPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Klientai");
  const customers = filteredCustomers();
  return `
    ${renderHeader(
      "Klientai",
      "Klientų kortelės, pardavimo istorija ir skolos.",
      `<button class="button" data-action="add-customer"><span class="button-icon">+</span>Pridėti klientą</button>`,
    )}
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="search">
          <span class="search-icon">⌕</span>
          <input class="input" data-customer-search value="${escapeHtml(state.customerQuery)}" placeholder="Ieškoti kliento pagal pavadinimą, kodą arba el. paštą" />
        </label>
      </div>
      <div class="toolbar-right muted">${customers.length} iš ${state.customers.length}</div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Klientas</th>
              <th>Tipas</th>
              <th>Įmonės kodas</th>
              <th>El. paštas</th>
              <th>Telefonas</th>
              <th>Būsena</th>
              <th class="actions-cell wide-actions">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            ${customers.length ? customers.map(renderCustomerRow).join("") : `<tr><td colspan="7"><div class="empty-state">Klientų pagal paiešką nėra.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCustomerRow(customer) {
  return `
    <tr>
      <td><strong>${escapeHtml(customer.name)}</strong></td>
      <td>${customer.type === "PERSON" ? "Fizinis asmuo" : "Įmonė"}</td>
      <td>${escapeHtml(customer.companyCode || "-")}</td>
      <td>${escapeHtml(customer.email || "-")}</td>
      <td>${escapeHtml(customer.phone || "-")}</td>
      <td>${customer.isActive ? renderStatusBadge("Aktyvus") : renderStatusBadge("Atšauktas")}</td>
      <td class="actions-cell wide-actions">
        <div class="action-group">
          <button class="link-button" data-action="view-customer" data-id="${customer.id}">Peržiūrėti</button>
          <button class="link-button" data-action="edit-customer" data-id="${customer.id}">✎ Redaguoti</button>
        </div>
      </td>
    </tr>
  `;
}

function filteredCustomers() {
  const query = state.customerQuery.trim().toLowerCase();
  return state.customers.filter((customer) => {
    if (!query) return true;
    return [customer.name, customer.companyCode, customer.vatCode, customer.email, customer.phone]
      .some((value) => String(value ?? "").toLowerCase().includes(query));
  });
}

function renderCustomerDebtsPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Klientų skolos");
  const debts = filteredCustomerDebts();
  const totalDebt = debts.reduce((sum, row) => sum + row.debt, 0);
  const overdueDebt = debts.reduce((sum, row) => sum + row.overdueDebt, 0);

  return `
    ${renderHeader("Klientų skolos", "Neapmokėti pardavimo dokumentai pagal klientus.")}
    <section class="summary-grid" aria-label="Skolų santrauka">
      <article class="metric"><p class="metric-label">Bendra skola</p><p class="metric-value">${formatMoney(totalDebt)}</p></article>
      <article class="metric"><p class="metric-label">Pradelsta</p><p class="metric-value">${formatMoney(overdueDebt)}</p></article>
      <article class="metric"><p class="metric-label">Klientai su skola</p><p class="metric-value">${debts.length}</p></article>
      <article class="metric"><p class="metric-label">Dokumentai</p><p class="metric-value">${debts.reduce((sum, row) => sum + row.documentCount, 0)}</p></article>
    </section>
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="search">
          <span class="search-icon">⌕</span>
          <input class="input" data-customer-debt-search value="${escapeHtml(state.customerDebtQuery)}" placeholder="Ieškoti kliento arba dokumento" />
        </label>
      </div>
      <div class="toolbar-right muted">${debts.length} klientai</div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Klientas</th>
              <th>Dokumentai</th>
              <th class="num">Skola</th>
              <th class="num">Pradelsta</th>
              <th>Seniausias terminas</th>
              <th>Paskutinis dokumentas</th>
              <th class="actions-cell">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            ${debts.length ? debts.map(renderCustomerDebtRow).join("") : `<tr><td colspan="7"><div class="empty-state">Neapmokėtų klientų skolų nėra.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function filteredCustomerDebts() {
  const query = state.customerDebtQuery.trim().toLowerCase();
  return customerDebtSummaries()
    .filter((row) => {
      if (!query) return true;
      return `${row.customer.name} ${row.customer.companyCode} ${row.documents.map((document) => document.number).join(" ")}`.toLowerCase().includes(query);
    })
    .sort((a, b) => b.debt - a.debt);
}

function customerDebtSummaries() {
  return state.customers
    .map((customer) => {
      const documents = state.salesDocuments.filter((document) =>
        idsEqual(document.customerId, customer.id) &&
        isCustomerDebtDocument(document) &&
        Number(document.debt) > 0,
      );
      const debt = documents.reduce((sum, document) => sum + Number(document.debt), 0);
      const overdueDocuments = documents.filter((document) => document.dueDate && document.dueDate < todayDate());
      return {
        customer,
        documents,
        debt,
        overdueDebt: overdueDocuments.reduce((sum, document) => sum + Number(document.debt), 0),
        documentCount: documents.length,
        oldestDueDate: documents.map((document) => document.dueDate).filter(Boolean).sort()[0] ?? "",
        lastDocument: documents.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0],
      };
    })
    .filter((row) => row.debt > 0);
}

function isCustomerDebtDocument(document) {
  return (
    ["ORDER", "PREPAYMENT_INVOICE", "INVOICE", "DELIVERY_NOTE"].includes(document.type) &&
    ["CONFIRMED", "PARTIALLY_PAID"].includes(document.status)
  );
}

function isFinalizedCustomerSalesDocument(document) {
  return (
    ["ORDER", "PREPAYMENT_INVOICE", "INVOICE", "DELIVERY_NOTE"].includes(document.type) &&
    !["DRAFT", "CANCELLED"].includes(document.status)
  );
}

function salesVatEntries() {
  return state.salesDocuments
    .filter((document) =>
      ["PREPAYMENT_INVOICE", "INVOICE"].includes(document.type) &&
      !["DRAFT", "CANCELLED"].includes(document.status),
    )
    .map((document) => {
      const customer = state.customers.find((item) => idsEqual(item.id, document.customerId)) ?? {};
      return {
        register: "sales",
        date: document.date,
        number: document.number,
        internalNumber: document.number,
        partyName: customer.name ?? "",
        partyCode: customer.companyCode ?? "",
        partyVatCode: customer.vatCode ?? "",
        subtotal: Number(document.subtotal) || 0,
        vat: Number(document.vat) || 0,
        total: Number(document.total) || 0,
        status: document.status,
        sourceLabel: salesTypeLabel(document.type),
        documentId: document.id,
      };
    });
}

function purchaseVatEntries() {
  return state.documents
    .filter((document) => document.status === STATUS_CONFIRMED)
    .map((document) => {
      const supplier = state.suppliers.find((item) => idsEqual(item.id, document.supplierId)) ?? {};
      const supplierDocumentNumber = document.supplierDocumentNumber || document.number;
      return {
        register: "purchase",
        date: document.date,
        number: supplierDocumentNumber,
        internalNumber: document.number,
        partyName: supplier.name ?? "",
        partyCode: supplier.code ?? "",
        partyVatCode: supplier.vatCode ?? "",
        subtotal: Number(document.subtotal) || 0,
        vat: Number(document.vat) || 0,
        total: Number(document.total) || 0,
        status: document.status,
        sourceLabel: "Pajamavimas",
        documentId: document.id,
      };
    });
}

function allVatEntries() {
  return [...salesVatEntries(), ...purchaseVatEntries()].sort((left, right) =>
    `${right.date}${right.number}`.localeCompare(`${left.date}${left.number}`, "lt"),
  );
}

function vatEntryMatchesDate(entry) {
  return (
    (!state.vatFilters.from || entry.date >= state.vatFilters.from) &&
    (!state.vatFilters.to || entry.date <= state.vatFilters.to)
  );
}

function filteredVatEntries() {
  return allVatEntries().filter((entry) => {
    return (
      vatEntryMatchesDate(entry) &&
      (state.vatFilters.register === "ALL" || entry.register === state.vatFilters.register)
    );
  });
}

function vatRegisterTotals(entries) {
  return entries.reduce(
    (totals, entry) => ({
      subtotal: totals.subtotal + Number(entry.subtotal || 0),
      vat: totals.vat + Number(entry.vat || 0),
      total: totals.total + Number(entry.total || 0),
    }),
    { subtotal: 0, vat: 0, total: 0 },
  );
}

function renderCustomerDebtRow(row) {
  return `
    <tr>
      <td><strong>${escapeHtml(row.customer.name)}</strong></td>
      <td>${row.documents.map((document) => `<button class="plain-link" data-action="view-sales-document" data-id="${document.id}">${escapeHtml(document.number)}</button>`).join(", ")}</td>
      <td class="num"><strong>${formatMoney(row.debt)}</strong></td>
      <td class="num">${row.overdueDebt > 0 ? `<strong class="danger-text">${formatMoney(row.overdueDebt)}</strong>` : formatMoney(0)}</td>
      <td>${row.oldestDueDate ? formatDate(row.oldestDueDate) : "-"}</td>
      <td>${row.lastDocument ? formatDate(row.lastDocument.date) : "-"}</td>
      <td class="actions-cell wide-actions">
        <div class="action-group">
          <button class="link-button" data-action="prepare-debt-reminder" data-id="${row.customer.id}">Priminimas</button>
          <button class="link-button" data-action="view-customer" data-id="${row.customer.id}">Kortelė</button>
        </div>
      </td>
    </tr>
  `;
}

function renderCustomerDetailPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Klientai");
  const customer = state.customers.find((item) => idsEqual(item.id, state.selectedCustomerId));
  if (!customer) {
    return `
      ${renderHeader("Klientas nerastas", "Pasirinkta kliento kortelė nebeegzistuoja.")}
      <button class="button secondary" data-action="back-to-customers">Grįžti į klientus</button>
    `;
  }
  const documents = state.salesDocuments.filter((document) => idsEqual(document.customerId, customer.id));
  const finalizedDocs = documents.filter(isFinalizedCustomerSalesDocument);
  const debtDocs = documents.filter(isCustomerDebtDocument);
  const totalSales = finalizedDocs.reduce((sum, document) => sum + Number(document.total), 0);
  const debt = debtDocs.reduce((sum, document) => sum + Number(document.debt), 0);
  const lastPurchase = finalizedDocs
    .map((document) => document.date)
    .sort()
    .at(-1);

  return `
    ${renderHeader(
      customer.name,
      "Kliento kortelė ir susiję pardavimo dokumentai.",
      `<div class="form-actions">
        <button class="button secondary" data-action="back-to-customers">Grįžti į klientus</button>
        <button class="button" data-action="edit-customer" data-id="${customer.id}">Redaguoti</button>
      </div>`,
    )}
    <section class="summary-grid" aria-label="Kliento santrauka">
      <article class="metric"><p class="metric-label">Bendra pardavimo suma</p><p class="metric-value">${formatMoney(totalSales)}</p></article>
      <article class="metric"><p class="metric-label">Neapmokėta skola</p><p class="metric-value">${formatMoney(debt)}</p></article>
      <article class="metric"><p class="metric-label">Dokumentai</p><p class="metric-value">${documents.length}</p></article>
      <article class="metric"><p class="metric-label">Paskutinis pirkimas</p><p class="metric-value">${lastPurchase ? formatDate(lastPurchase) : "-"}</p></article>
    </section>
    <section class="document-panel">
      <div class="detail-grid product-detail-grid">
        ${detailItem("Tipas", customer.type === "PERSON" ? "Fizinis asmuo" : "Įmonė")}
        ${detailItem("Įmonės kodas", escapeHtml(customer.companyCode || "-"))}
        ${detailItem("PVM kodas", escapeHtml(customer.vatCode || "-"))}
        ${detailItem("Kontaktinis asmuo", escapeHtml(customer.contactPerson || "-"))}
        ${detailItem("El. paštas", escapeHtml(customer.email || "-"))}
        ${detailItem("Telefonas", escapeHtml(customer.phone || "-"))}
        ${detailItem("Adresas", escapeHtml(customer.address || "-"))}
        ${detailItem("Būsena", customer.isActive ? "Aktyvus" : "Neaktyvus")}
        ${detailItem("Sukurta", formatDateTime(customer.createdAt))}
        ${detailItem("Atnaujinta", formatDateTime(customer.updatedAt))}
      </div>
      <div class="lines-header"><h2>Susiję pardavimo dokumentai</h2></div>
      <div class="table-scroll">
        <table class="documents-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Dokumento Nr.</th>
              <th>Tipas</th>
              <th>Būsena</th>
              <th class="num">Bendra suma</th>
              <th class="num">Skola</th>
            </tr>
          </thead>
          <tbody>
            ${documents.length ? documents.map((document) => `
              <tr>
                <td>${formatDate(document.date)}</td>
                <td><button class="plain-link" data-action="view-sales-document" data-id="${document.id}">${escapeHtml(document.number)}</button></td>
                <td>${salesTypeLabel(document.type)}</td>
                <td>${renderSalesStatusBadge(document.status)}</td>
                <td class="num">${formatMoney(document.total)}</td>
                <td class="num">${formatMoney(document.debt)}</td>
              </tr>
            `).join("") : `<tr><td colspan="6"><div class="empty-state">Šis klientas dar neturi pardavimo dokumentų.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSuppliersPage() {
  return `
    ${renderHeader(
      "Tiekėjai",
      "Kontaktai ir įmonių rekvizitai prekių pajamavimui.",
      `<button class="button" data-action="add-supplier"><span class="button-icon">+</span>Pridėti tiekėją</button>`,
    )}
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tiekėjas</th>
              <th>Įmonės kodas</th>
              <th>El. paštas</th>
              <th>Telefonas</th>
              <th class="actions-cell"></th>
            </tr>
          </thead>
          <tbody>
            ${state.suppliers
              .map(
                (supplier) => `
                  <tr>
                    <td><strong>${escapeHtml(supplier.name)}</strong></td>
                    <td>${escapeHtml(supplier.code)}</td>
                    <td>${escapeHtml(supplier.email)}</td>
                    <td>${escapeHtml(supplier.phone)}</td>
                    <td class="actions-cell">
                      <button class="link-button" data-action="edit-supplier" data-id="${supplier.id}">✎ Redaguoti</button>
                    </td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDocumentsPage() {
  const filters = state.documentFilters;
  const documents = filteredDocuments();

  return `
    ${renderHeader(
      "Pajamavimo dokumentai",
      "Prekių priėmimo į sandėlį dokumentų sąrašas.",
      `<button class="button" data-action="new-document"><span class="button-icon">+</span>Naujas pajamavimas</button>`,
    )}
    <div class="toolbar document-toolbar">
      <div class="filter-row">
        <label class="form-field compact-field">
          <span class="label">Dokumento Nr.</span>
          <input class="input" data-filter="number" value="${escapeHtml(filters.number)}" placeholder="Ieškoti dokumento" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Tiekėjas</span>
          <select class="select" data-filter="supplierId">
            <option value="">Visi tiekėjai</option>
            ${state.suppliers
              .map(
                (supplier) => `
                  <option value="${supplier.id}" ${filters.supplierId === String(supplier.id) ? "selected" : ""}>${escapeHtml(supplier.name)}</option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="form-field compact-field">
          <span class="label">Būsena</span>
          <select class="select" data-filter="status">
            <option value="">Visos būsenos</option>
            ${[STATUS_DRAFT, STATUS_CONFIRMED, STATUS_CANCELLED]
              .map(
                (status) => `
                  <option value="${status}" ${filters.status === status ? "selected" : ""}>${status}</option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="form-field date-field">
          <span class="label">Data nuo</span>
          <input class="input" type="date" data-filter="from" value="${escapeHtml(filters.from)}" />
        </label>
        <label class="form-field date-field">
          <span class="label">Data iki</span>
          <input class="input" type="date" data-filter="to" value="${escapeHtml(filters.to)}" />
        </label>
        <button class="button secondary filter-clear" data-action="clear-document-filters">Išvalyti filtrus</button>
      </div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table class="documents-table">
          <thead>
            <tr>
              <th>Dokumento Nr.</th>
              <th>Tiekėjas</th>
              <th>Data</th>
              <th class="num">Prekių kiekis</th>
              <th class="num">Suma be PVM</th>
              <th class="num">Bendra suma</th>
              <th>Būsena</th>
              <th>Sukūrimo data</th>
              <th class="actions-cell wide-actions">Veiksmai</th>
            </tr>
          </thead>
          <tbody data-documents-body>
            ${renderDocumentsRows(documents)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function filteredDocuments() {
  const filters = state.documentFilters;
  return state.documents.filter((document) => {
    const supplierMatch = !filters.supplierId || idsEqual(document.supplierId, filters.supplierId);
    const statusMatch = !filters.status || document.status === filters.status;
    const numberMatch =
      !filters.number || document.number.toLowerCase().includes(filters.number.toLowerCase());
    const fromMatch = !filters.from || document.date >= filters.from;
    const toMatch = !filters.to || document.date <= filters.to;
    return supplierMatch && statusMatch && numberMatch && fromMatch && toMatch;
  });
}

function renderDocumentsRows(documents) {
  return documents.length
    ? documents
        .map(
          (document) => `
            <tr>
              <td><strong>${escapeHtml(document.number)}</strong></td>
              <td>${escapeHtml(supplierName(document.supplierId))}</td>
              <td>${formatDate(document.date)}</td>
              <td class="num">${formatNumber(document.itemCount)}</td>
              <td class="num">${formatMoney(document.subtotal)}</td>
              <td class="num">${formatMoney(document.total)}</td>
              <td>${renderStatusBadge(document.status)}</td>
              <td>${formatDateTime(document.createdAt)}</td>
              <td class="actions-cell wide-actions">
                <div class="action-group">${renderDocumentActions(document)}</div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="9"><div class="empty-state">Dokumentų pagal pasirinktus filtrus nėra.</div></td></tr>`;
}

function renderDocumentActions(document) {
  const actions = [
    `<button class="link-button" data-action="view-document" data-id="${document.id}">Peržiūrėti</button>`,
  ];
  if (document.status === STATUS_DRAFT) {
    actions.push(`<button class="link-button" data-action="edit-document" data-id="${document.id}">Redaguoti</button>`);
    actions.push(`<button class="link-button" data-action="confirm-existing-document" data-id="${document.id}">Patvirtinti</button>`);
    actions.push(`<button class="link-button danger-link" data-action="delete-document" data-id="${document.id}">Ištrinti</button>`);
  }
  if (document.status === STATUS_CONFIRMED) {
    actions.push(`<button class="link-button danger-link" data-action="cancel-document" data-id="${document.id}">Atšaukti</button>`);
  }
  return actions.join("");
}

function renderStatusBadge(status) {
  const className =
    status === STATUS_CONFIRMED ? "success" : status === STATUS_CANCELLED ? "danger" : "warning";
  return `<span class="badge ${className}">${status}</span>`;
}

function renderSalesSchemaNotice(title = "Pardavimai") {
  return `
    ${renderHeader(title, "Pardavimų duomenų bazės lentelės dar neįjungtos.")}
    <section class="document-panel">
      <div class="setup-block">
        <h2>Reikia paleisti pardavimų SQL migraciją</h2>
        <p>Pagrindinė sandėlio sistema veikia toliau. Kad pradėtų veikti klientai, pardavimų dokumentai, rezervacijos ir mokėjimai, Supabase SQL Editor lange paleiskite failą <strong>scripts/outputs/supabase-sales-module.sql</strong>.</p>
      </div>
    </section>
  `;
}

function renderAccountingSchemaNotice(title = "Buhalterija") {
  return `
    ${renderHeader(title, "Buhalterijos nustatymų lentelė dar neįjungta.", "", "Buhalterija")}
    <section class="document-panel">
      <div class="setup-block">
        <h2>Reikia paleisti buhalterijos SQL migraciją</h2>
        <p>Supabase SQL Editor lange paleiskite failą <strong>scripts/outputs/supabase-accounting-module.sql</strong>. Po to perkraukite šį puslapį.</p>
      </div>
    </section>
  `;
}

function renderVatRegistersPage() {
  if (!state.accountingSchemaReady) return renderAccountingSchemaNotice("PVM registrai");
  const entries = filteredVatEntries();
  const totals = vatRegisterTotals(entries);
  const salesTotals = vatRegisterTotals(salesVatEntries().filter(vatEntryMatchesDate));
  const purchaseTotals = vatRegisterTotals(purchaseVatEntries().filter(vatEntryMatchesDate));
  const payableVat = salesTotals.vat - purchaseTotals.vat;

  return `
    ${renderHeader(
      "PVM registrai",
      "Pirkimų ir pardavimų PVM pagal patvirtintus dokumentus.",
      `<div class="form-actions">
        <button class="button secondary" data-action="download-vat-csv">CSV eksportas</button>
        <button class="button" data-page="isaf-export">i.SAF eksportas</button>
      </div>`,
      "Buhalterija",
    )}
    ${renderVatFiltersToolbar()}
    <div class="summary-grid">
      ${metricCard("Įrašų", entries.length)}
      ${metricCard("Pardavimo PVM", formatMoney(salesTotals.vat))}
      ${metricCard("Pirkimo PVM", formatMoney(purchaseTotals.vat))}
      ${metricCard("Mokėtinas PVM", formatMoney(payableVat))}
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Registras</th>
              <th>Data</th>
              <th>Dokumentas</th>
              <th>Partneris</th>
              <th>Kodas</th>
              <th>PVM kodas</th>
              <th class="num">Suma be PVM</th>
              <th class="num">PVM</th>
              <th class="num">Bendra suma</th>
              <th>Šaltinis</th>
            </tr>
          </thead>
          <tbody>
            ${renderVatRegisterRows(entries)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderIsafExportPage() {
  if (!state.accountingSchemaReady) return renderAccountingSchemaNotice("i.SAF eksportas");
  const settings = state.accountingSettings;
  const salesEntries = salesVatEntries().filter(vatEntryMatchesDate);
  const purchaseEntries = purchaseVatEntries().filter(vatEntryMatchesDate);
  const entries = filteredVatEntries();
  const missing = missingIsafSettings();
  const exportDisabled = missing.length ? "disabled" : "";

  return `
    ${renderHeader(
      "i.SAF eksportas",
      "VMI i.SAF rinkmena rankiniam įkėlimui į i.MAS.",
      `<div class="form-actions">
        <button class="button secondary" data-page="accounting-settings">Įmonės nustatymai</button>
        <button class="button" data-action="download-isaf-xml" ${exportDisabled}>Atsisiųsti XML</button>
      </div>`,
      "Buhalterija",
    )}
    ${renderVatFiltersToolbar()}
    ${
      missing.length
        ? `<div class="auth-message">Užpildykite prieš eksportą: ${missing.map(escapeHtml).join(", ")}.</div>`
        : `<div class="auth-message success-message">XML bus formuojamas pagal esamus PVM registrų įrašus. Prieš pateikiant VMI, rinkmeną patikrinkite i.MAS pagal galiojančią i.SAF XSD schemą.</div>`
    }
    <section class="document-panel">
      <div class="detail-grid">
        ${detailItem("Įmonė", escapeHtml(settings.companyName || "-"))}
        ${detailItem("Įmonės kodas", escapeHtml(settings.companyCode || "-"))}
        ${detailItem("PVM kodas", escapeHtml(settings.vatCode || "-"))}
        ${detailItem("Laikotarpis", `${escapeHtml(state.vatFilters.from)} - ${escapeHtml(state.vatFilters.to)}`)}
        ${detailItem("Pardavimo įrašai", String(salesEntries.length))}
        ${detailItem("Pirkimo įrašai", String(purchaseEntries.length))}
        ${detailItem("Suma be PVM", formatMoney(vatRegisterTotals(entries).subtotal))}
        ${detailItem("PVM", formatMoney(vatRegisterTotals(entries).vat))}
      </div>
    </section>
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Registras</th>
              <th>Data</th>
              <th>Dokumentas</th>
              <th>Partneris</th>
              <th class="num">Suma be PVM</th>
              <th class="num">PVM</th>
              <th class="num">Bendra suma</th>
            </tr>
          </thead>
          <tbody>
            ${
              entries.length
                ? entries.map((entry) => `
                    <tr>
                      <td>${renderVatRegisterBadge(entry.register)}</td>
                      <td>${escapeHtml(entry.date)}</td>
                      <td><strong>${escapeHtml(entry.number)}</strong></td>
                      <td>${escapeHtml(entry.partyName)}</td>
                      <td class="num">${formatMoney(entry.subtotal)}</td>
                      <td class="num">${formatMoney(entry.vat)}</td>
                      <td class="num">${formatMoney(entry.total)}</td>
                    </tr>
                  `).join("")
                : `<tr><td colspan="7"><div class="empty-state">Pasirinktame laikotarpyje i.SAF įrašų nėra.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAccountingSettingsPage() {
  if (!state.accountingSchemaReady) return renderAccountingSchemaNotice("Įmonės nustatymai");
  const settings = state.accountingSettings;
  return `
    ${renderHeader("Įmonės nustatymai", "Duomenys, naudojami PVM registrams ir i.SAF rinkmenai.", "", "Buhalterija")}
    <section class="document-panel">
      <form data-form="accounting-settings">
        <div class="form-grid">
          ${textField("Įmonės pavadinimas", "companyName", settings.companyName)}
          ${textField("Įmonės kodas", "companyCode", settings.companyCode)}
          ${textField("PVM mokėtojo kodas", "vatCode", settings.vatCode)}
          ${textField("Adresas", "address", settings.address)}
          ${textField("El. paštas", "email", settings.email, "email")}
          ${textField("Telefonas", "phone", settings.phone)}
          ${textField("Programos pavadinimas", "softwareName", settings.softwareName)}
          ${textField("Programos versija", "softwareVersion", settings.softwareVersion)}
        </div>
        <div class="form-actions form-footer">
          <button class="button" type="submit" ${state.isSaving ? "disabled" : ""}>Išsaugoti</button>
        </div>
      </form>
    </section>
  `;
}

function renderVatFiltersToolbar() {
  return `
    <div class="toolbar document-toolbar">
      <div class="filter-row">
        <label class="form-field compact-field">
          <span class="label">Nuo</span>
          <input class="input" type="date" data-vat-filter="from" value="${escapeHtml(state.vatFilters.from)}" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Iki</span>
          <input class="input" type="date" data-vat-filter="to" value="${escapeHtml(state.vatFilters.to)}" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Registras</span>
          <select class="select" data-vat-filter="register">
            <option value="ALL" ${state.vatFilters.register === "ALL" ? "selected" : ""}>Visi</option>
            <option value="sales" ${state.vatFilters.register === "sales" ? "selected" : ""}>Pardavimai</option>
            <option value="purchase" ${state.vatFilters.register === "purchase" ? "selected" : ""}>Pirkimai</option>
          </select>
        </label>
      </div>
      <div class="toolbar-right muted">Pagal patvirtintus dokumentus</div>
    </div>
  `;
}

function renderVatRegisterRows(entries) {
  return entries.length
    ? entries.map((entry) => `
        <tr>
          <td>${renderVatRegisterBadge(entry.register)}</td>
          <td>${escapeHtml(entry.date)}</td>
          <td>
            <strong>${escapeHtml(entry.number)}</strong>
            ${entry.internalNumber && entry.internalNumber !== entry.number ? `<div class="muted small-text">Vidinis: ${escapeHtml(entry.internalNumber)}</div>` : ""}
          </td>
          <td>${escapeHtml(entry.partyName)}</td>
          <td>${escapeHtml(entry.partyCode || "-")}</td>
          <td>${escapeHtml(entry.partyVatCode || "-")}</td>
          <td class="num">${formatMoney(entry.subtotal)}</td>
          <td class="num">${formatMoney(entry.vat)}</td>
          <td class="num">${formatMoney(entry.total)}</td>
          <td>${escapeHtml(entry.sourceLabel)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="10"><div class="empty-state">Pasirinktame laikotarpyje PVM registro įrašų nėra.</div></td></tr>`;
}

function renderVatRegisterBadge(register) {
  return `<span class="badge ${register === "sales" ? "success" : "warning"}">${register === "sales" ? "Pardavimai" : "Pirkimai"}</span>`;
}

function salesTypeLabel(type) {
  return SALES_TYPES[type]?.label ?? type;
}

function salesTypePlural(type) {
  return SALES_TYPES[type]?.plural ?? type;
}

function renderNumberingPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Numeracija");
  const date = state.numberingDate || todayDate();
  const month = date.slice(0, 7);
  const receiptPrefix = `PJD-${month}-`;
  const rows = [
    {
      label: "Pajamavimo dokumentas",
      prefix: receiptPrefix,
      nextNumber: nextDocumentNumber(date),
      existingCount: state.documents.filter((document) => document.number.startsWith(receiptPrefix)).length,
    },
    ...SALES_TYPE_ORDER.map((type) => {
      const prefix = `${SALES_TYPES[type].prefix}-${month}-`;
      return {
        label: salesTypeLabel(type),
        prefix,
        nextNumber: nextSalesDocumentNumber(type, date),
        existingCount: state.salesDocuments.filter((document) => document.number.startsWith(prefix)).length,
      };
    }),
  ];

  return `
    ${renderHeader("Numeracija", "Dokumentų numerių peržiūra pagal pasirinktą mėnesį.")}
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="form-field compact-field">
          <span class="label">Mėnuo</span>
          <input class="input" type="month" data-numbering-date value="${escapeHtml(month)}" />
        </label>
      </div>
      <div class="toolbar-right muted">Skaičiuojama pagal Supabase dokumentus</div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Dokumento tipas</th>
              <th>Prefiksas</th>
              <th>Kitas numeris</th>
              <th class="num">Sukurta šiame mėnesyje</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.label)}</strong></td>
                <td>${escapeHtml(row.prefix)}</td>
                <td><strong>${escapeHtml(row.nextNumber)}</strong></td>
                <td class="num">${row.existingCount}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSalesStatusBadge(status) {
  const label = SALES_STATUS[status] ?? status;
  const className =
    status === "PAID" || status === "CONFIRMED"
      ? "success"
      : status === "CANCELLED"
        ? "danger"
        : "warning";
  return `<span class="badge ${className}">${label}</span>`;
}

function renderSalesTabs() {
  return `
    <div class="tabs" role="tablist">
      ${SALES_TYPE_ORDER.map(
        (type) => `
          <button class="tab-button ${state.salesTab === type ? "active" : ""}" data-page="sales" data-sales-tab="${type}">
            ${SALES_TYPES[type].plural}
          </button>
        `,
      ).join("")}
    </div>
  `;
}

function renderSalesPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Pardavimai");
  const documents = paginatedSalesDocuments();
  const allFiltered = filteredSalesDocuments();
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / state.salesPagination.pageSize));
  return `
    ${renderHeader(
      "Pardavimai",
      "Pardavimo dokumentai, rezervacijos, apmokėjimai ir dokumentų grandinė.",
      `<div class="form-actions">
        <button class="button secondary" data-action="export-sales-excel">Excel eksportas</button>
        <button class="button secondary" data-action="print-sales-pdf">PDF spausdinimas</button>
        <button class="button" data-action="new-sales-document"><span class="button-icon">+</span>Naujas dokumentas</button>
      </div>`,
    )}
    ${renderSalesTabs()}
    ${!state.salesAdvancedReady ? `<div class="auth-message">Įkeltos pagrindinės pardavimų lentelės. Juodraščiai veiks, bet rezervacijoms, važtaraščių patvirtinimui, atšaukimui ir mokėjimams dar reikia paleisti likusią SQL funkcijų dalį.</div>` : ""}
    <div class="toolbar document-toolbar">
      <div class="filter-row">
        <label class="search">
          <span class="search-icon">⌕</span>
          <input class="input" data-sales-search value="${escapeHtml(state.salesQuery)}" placeholder="Ieškoti pagal dokumentą arba klientą" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Dokumento Nr.</span>
          <input class="input" data-sales-filter="number" value="${escapeHtml(state.salesFilters.number)}" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Klientas</span>
          <select class="select" data-sales-filter="customerId">
            <option value="">Visi klientai</option>
            ${state.customers.map((customer) => `<option value="${customer.id}" ${state.salesFilters.customerId === String(customer.id) ? "selected" : ""}>${escapeHtml(customer.name)}</option>`).join("")}
          </select>
        </label>
        <label class="form-field compact-field">
          <span class="label">Dokumento tipas</span>
          <select class="select" data-sales-filter="type">
            <option value="">Aktyvus skirtukas</option>
            ${SALES_TYPE_ORDER.map((type) => `<option value="${type}" ${state.salesFilters.type === type ? "selected" : ""}>${salesTypeLabel(type)}</option>`).join("")}
          </select>
        </label>
        <label class="form-field compact-field">
          <span class="label">Būsena</span>
          <select class="select" data-sales-filter="status">
            <option value="">Visos būsenos</option>
            ${Object.entries(SALES_STATUS).map(([status, label]) => `<option value="${status}" ${state.salesFilters.status === status ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label class="form-field date-field">
          <span class="label">Data nuo</span>
          <input class="input" type="date" data-sales-filter="from" value="${escapeHtml(state.salesFilters.from)}" />
        </label>
        <label class="form-field date-field">
          <span class="label">Data iki</span>
          <input class="input" type="date" data-sales-filter="to" value="${escapeHtml(state.salesFilters.to)}" />
        </label>
        <label class="form-field compact-field">
          <span class="label">Atsakingas</span>
          <input class="input" data-sales-filter="responsible" value="${escapeHtml(state.salesFilters.responsible)}" />
        </label>
        <label class="checkbox-field">
          <input type="checkbox" data-sales-filter="unpaidOnly" ${state.salesFilters.unpaidOnly ? "checked" : ""} />
          <span>Tik neapmokėti</span>
        </label>
        <button class="button secondary" data-action="clear-sales-filters">Išvalyti filtrus</button>
      </div>
    </div>
    <section class="table-panel">
      <div class="table-scroll">
        <table class="documents-table sales-table">
          <thead>
            <tr>
              ${salesSortableTh("date", "Data")}
              ${salesSortableTh("number", "Dokumento Nr.")}
              ${salesSortableTh("customer", "Klientas")}
              <th>Kliento dok. Nr.</th>
              <th>Būsena</th>
              <th class="num">Suma be PVM</th>
              <th class="num">PVM suma</th>
              <th class="num">Bendra suma</th>
              <th class="num">Apmokėta</th>
              <th class="num">Skola</th>
              <th>Valiuta</th>
              <th>Atsakingas</th>
              <th>Sukūrimo data</th>
              <th class="actions-cell sales-actions-cell">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            ${documents.length ? documents.map(renderSalesDocumentRow).join("") : `<tr><td colspan="14"><div class="empty-state">Pardavimo dokumentų pagal pasirinktus filtrus nėra.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    <div class="pagination-bar">
      <span>Rasta: ${allFiltered.length}</span>
      <label>
        Rodyti
        <select class="select compact-select" data-sales-page-size>
          ${[20, 50, 100].map((size) => `<option value="${size}" ${state.salesPagination.pageSize === size ? "selected" : ""}>${size}</option>`).join("")}
        </select>
      </label>
      <div class="form-actions">
        <button class="button secondary" data-action="sales-prev-page" ${state.salesPagination.page <= 1 ? "disabled" : ""}>Atgal</button>
        <span>${state.salesPagination.page} / ${totalPages}</span>
        <button class="button secondary" data-action="sales-next-page" ${state.salesPagination.page >= totalPages ? "disabled" : ""}>Pirmyn</button>
      </div>
    </div>
  `;
}

function salesSortableTh(field, label) {
  const marker = state.salesSort.field === field ? (state.salesSort.direction === "asc" ? " ↑" : " ↓") : "";
  return `<th><button class="sort-button" data-action="sort-sales" data-sort="${field}">${label}${marker}</button></th>`;
}

function renderSalesDocumentRow(document) {
  return `
    <tr>
      <td>${formatDate(document.date)}</td>
      <td><strong>${escapeHtml(document.number)}</strong></td>
      <td>${escapeHtml(customerName(document.customerId))}</td>
      <td>${escapeHtml(document.customerDocumentNumber || "-")}</td>
      <td>${renderSalesStatusBadge(document.status)}</td>
      <td class="num">${formatMoney(document.subtotal)}</td>
      <td class="num">${formatMoney(document.vat)}</td>
      <td class="num">${formatMoney(document.total)}</td>
      <td class="num">${formatMoney(document.paidAmount)}</td>
      <td class="num">${formatMoney(document.debt)}</td>
      <td>${escapeHtml(document.currency)}</td>
      <td>${escapeHtml(document.responsibleEmployee || "-")}</td>
      <td>${formatDateTime(document.createdAt)}</td>
      <td class="actions-cell sales-actions-cell">${renderSalesActionsMenu(document)}</td>
    </tr>
  `;
}

function renderSalesActionsMenu(document) {
  const canCancel = canCancelSalesDocument(document);
  return `
    <div class="sales-row-actions">
      <button class="link-button" data-action="view-sales-document" data-id="${document.id}">Peržiūrėti</button>
      ${document.status === "DRAFT" ? `<button class="link-button" data-action="edit-sales-document" data-id="${document.id}">Redaguoti</button>` : ""}
      <button class="link-button" data-action="copy-sales-document" data-id="${document.id}">Kopijuoti</button>
      ${CONVERSION_TARGETS[document.type].map((target) => `<button class="link-button" data-action="convert-sales-document" data-id="${document.id}" data-target-type="${target}">Į ${salesTypeLabel(target)}</button>`).join("")}
      <button class="link-button" data-action="print-sales-document" data-id="${document.id}">PDF</button>
      ${document.type === "DELIVERY_NOTE" && document.status === "DRAFT" ? `<button class="link-button" data-action="confirm-delivery-note" data-id="${document.id}" ${!state.salesAdvancedReady ? "disabled" : ""}>Patvirtinti</button>` : ""}
      ${document.type === "DELIVERY_NOTE" && document.status === "CONFIRMED" ? `<button class="link-button danger-link" data-action="cancel-delivery-note" data-id="${document.id}" ${!state.salesAdvancedReady ? "disabled" : ""}>Atšaukti važtaraštį</button>` : ""}
      ${canCancel ? `<button class="link-button danger-link" data-action="cancel-sales-document" data-id="${document.id}">Atšaukti</button>` : ""}
      ${document.status === "DRAFT" ? `<button class="link-button danger-link" data-action="delete-sales-draft" data-id="${document.id}">Ištrinti</button>` : ""}
    </div>
  `;
}

function canCancelSalesDocument(document) {
  if (!document || document.status === "CANCELLED") return false;
  if (Number(document.paidAmount) > 0) return false;
  if (document.type === "DELIVERY_NOTE" && document.status === "CONFIRMED") return false;
  return document.status === "DRAFT" || document.type === "ORDER";
}

function filteredSalesDocuments() {
  const filters = state.salesFilters;
  const query = state.salesQuery.trim().toLowerCase();
  const activeType = filters.type || state.salesTab;
  return state.salesDocuments
    .filter((document) => {
      const customer = customerName(document.customerId);
      return (
        (!activeType || document.type === activeType) &&
        (!filters.number || document.number.toLowerCase().includes(filters.number.toLowerCase())) &&
        (!filters.customerId || idsEqual(document.customerId, filters.customerId)) &&
        (!filters.status || document.status === filters.status) &&
        (!filters.from || document.date >= filters.from) &&
        (!filters.to || document.date <= filters.to) &&
        (!filters.unpaidOnly || Number(document.debt) > 0) &&
        (!filters.responsible || document.responsibleEmployee.toLowerCase().includes(filters.responsible.toLowerCase())) &&
        (!query || `${document.number} ${customer} ${document.customerDocumentNumber}`.toLowerCase().includes(query))
      );
    })
    .sort(compareSalesDocuments);
}

function compareSalesDocuments(left, right) {
  const direction = state.salesSort.direction === "asc" ? 1 : -1;
  const field = state.salesSort.field;
  const values = {
    date: [left.date, right.date],
    number: [left.number, right.number],
    customer: [customerName(left.customerId), customerName(right.customerId)],
  }[field] ?? [left.createdAt, right.createdAt];
  return String(values[0]).localeCompare(String(values[1]), "lt") * direction;
}

function paginatedSalesDocuments() {
  const documents = filteredSalesDocuments();
  const start = (state.salesPagination.page - 1) * state.salesPagination.pageSize;
  return documents.slice(start, start + state.salesPagination.pageSize);
}

function exportSalesExcel() {
  const rows = filteredSalesDocuments();
  const header = [
    "Data",
    "Dokumento Nr.",
    "Tipas",
    "Klientas",
    "Būsena",
    "Suma be PVM",
    "PVM",
    "Bendra suma",
    "Apmokėta",
    "Skola",
    "Valiuta",
    "Atsakingas",
  ];
  const csvRows = [
    header,
    ...rows.map((document) => [
      document.date,
      document.number,
      salesTypeLabel(document.type),
      customerName(document.customerId),
      SALES_STATUS[document.status] ?? document.status,
      document.subtotal,
      document.vat,
      document.total,
      document.paidAmount,
      document.debt,
      document.currency,
      document.responsibleEmployee,
    ]),
  ];
  const csv = csvRows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pardavimai-${todayDate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadVatCsv() {
  const entries = filteredVatEntries();
  const rows = [
    ["Registras", "Data", "Dokumento Nr.", "Partneris", "Kodas", "PVM kodas", "Suma be PVM", "PVM", "Bendra suma", "Šaltinis"],
    ...entries.map((entry) => [
      entry.register === "sales" ? "Pardavimai" : "Pirkimai",
      entry.date,
      entry.number,
      entry.partyName,
      entry.partyCode,
      entry.partyVatCode,
      toDecimal(entry.subtotal),
      toDecimal(entry.vat),
      toDecimal(entry.total),
      entry.sourceLabel,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  downloadTextFile(`pvm-registrai-${state.vatFilters.from}-${state.vatFilters.to}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
}

function downloadIsafXml() {
  const missing = missingIsafSettings();
  if (missing.length) {
    setToast(`Užpildykite: ${missing.join(", ")}.`);
    return;
  }
  const xml = buildIsafXml();
  downloadTextFile(`isaf-${state.vatFilters.from}-${state.vatFilters.to}.xml`, xml, "application/xml;charset=utf-8");
  setToast("i.SAF XML rinkmena paruošta atsisiuntimui.");
}

function missingIsafSettings() {
  const settings = state.accountingSettings;
  return [
    [settings.companyName, "įmonės pavadinimas"],
    [settings.companyCode, "įmonės kodas"],
    [settings.vatCode, "PVM mokėtojo kodas"],
  ]
    .filter(([value]) => !String(value ?? "").trim())
    .map(([, label]) => label);
}

function buildIsafXml() {
  const settings = state.accountingSettings;
  const salesEntries = salesVatEntries().filter(vatEntryMatchesDate);
  const purchaseEntries = purchaseVatEntries().filter(vatEntryMatchesDate);
  const salesXml = salesEntries.map((entry, index) => renderIsafInvoiceXml(entry, index + 1)).join("\n");
  const purchaseXml = purchaseEntries.map((entry, index) => renderIsafInvoiceXml(entry, index + 1)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<iSAFFile>
  <Header>
    <FileDescription>i.SAF PVM sąskaitų faktūrų registrų rinkmena</FileDescription>
    <FileVersion>1.0</FileVersion>
    <CompanyName>${escapeXml(settings.companyName)}</CompanyName>
    <CompanyCode>${escapeXml(settings.companyCode)}</CompanyCode>
    <TaxRegistrationNumber>${escapeXml(settings.vatCode)}</TaxRegistrationNumber>
    <Address>${escapeXml(settings.address)}</Address>
    <PeriodStart>${escapeXml(state.vatFilters.from)}</PeriodStart>
    <PeriodEnd>${escapeXml(state.vatFilters.to)}</PeriodEnd>
    <CurrencyCode>EUR</CurrencyCode>
    <SoftwareName>${escapeXml(settings.softwareName)}</SoftwareName>
    <SoftwareVersion>${escapeXml(settings.softwareVersion)}</SoftwareVersion>
    <GeneratedAt>${escapeXml(nowIso())}</GeneratedAt>
  </Header>
  <SalesInvoices>
${salesXml || "  "}
  </SalesInvoices>
  <PurchaseInvoices>
${purchaseXml || "  "}
  </PurchaseInvoices>
</iSAFFile>
`;
}

function renderIsafInvoiceXml(entry, index) {
  return `    <Invoice>
      <LineNumber>${index}</LineNumber>
      <InvoiceNumber>${escapeXml(entry.number)}</InvoiceNumber>
      <InvoiceDate>${escapeXml(entry.date)}</InvoiceDate>
      <CounterpartyName>${escapeXml(entry.partyName)}</CounterpartyName>
      <CounterpartyCode>${escapeXml(entry.partyCode || "ND")}</CounterpartyCode>
      <CounterpartyVATCode>${escapeXml(entry.partyVatCode || "ND")}</CounterpartyVATCode>
      <TaxableAmount>${toDecimal(entry.subtotal)}</TaxableAmount>
      <VATAmount>${toDecimal(entry.vat)}</VATAmount>
      <TotalAmount>${toDecimal(entry.total)}</TotalAmount>
      <VATRate>21</VATRate>
      <SourceDocument>${escapeXml(entry.sourceLabel)}</SourceDocument>
    </Invoice>`;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toDecimal(value) {
  return (Number(value) || 0).toFixed(2);
}

function renderNewSalesDocumentPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Naujas pardavimo dokumentas");
  const doc = state.salesDraft;
  const totals = salesDocumentTotals(doc.rows, []);
  const isEditing = Boolean(doc.editingId);
  return `
    ${renderHeader(
      isEditing ? `Redaguoti: ${doc.number}` : "Naujas pardavimo dokumentas",
      "Dokumentas nekeičia sandėlio likučio, kol nepatvirtinamas važtaraštis.",
    )}
    <section class="document-panel">
      ${!state.salesAdvancedReady ? `<div class="auth-message">Įkeltos tik pagrindinės pardavimų lentelės. Rezervacijoms, važtaraščių patvirtinimui ir mokėjimams dar reikia paleisti papildomą SQL funkcijų dalį.</div>` : ""}
      <div class="document-head sales-document-head">
        <label class="form-field">
          <span class="label">Dokumento tipas</span>
          <select class="select" data-sales-doc-field="type" ${isEditing ? "disabled" : ""}>
            ${SALES_TYPE_ORDER.map((type) => `<option value="${type}" ${doc.type === type ? "selected" : ""}>${salesTypeLabel(type)}</option>`).join("")}
          </select>
        </label>
        <label class="form-field">
          <span class="label">Dokumento Nr.</span>
          <input class="input readonly-input" data-sales-doc-field="number" value="${escapeHtml(doc.number)}" readonly />
        </label>
        <label class="form-field">
          <span class="label">Data</span>
          <input class="input" type="date" data-sales-doc-field="date" value="${escapeHtml(doc.date)}" />
        </label>
        <label class="form-field">
          <span class="label">Klientas</span>
          <select class="select" data-sales-doc-field="customerId">
            <option value="">Pasirinkti klientą</option>
            ${state.customers.filter((customer) => customer.isActive).map((customer) => `<option value="${customer.id}" ${doc.customerId === String(customer.id) ? "selected" : ""}>${escapeHtml(customer.name)}</option>`).join("")}
          </select>
        </label>
        <label class="form-field">
          <span class="label">Kliento dokumento Nr.</span>
          <input class="input" data-sales-doc-field="customerDocumentNumber" value="${escapeHtml(doc.customerDocumentNumber)}" />
        </label>
        <label class="form-field">
          <span class="label">Apmokėjimo terminas</span>
          <input class="input" type="date" data-sales-doc-field="dueDate" value="${escapeHtml(doc.dueDate)}" />
        </label>
        <label class="form-field">
          <span class="label">Valiuta</span>
          <select class="select" data-sales-doc-field="currency">
            ${["EUR", "USD", "PLN"].map((currency) => `<option value="${currency}" ${doc.currency === currency ? "selected" : ""}>${currency}</option>`).join("")}
          </select>
        </label>
        <label class="form-field">
          <span class="label">Atsakingas darbuotojas</span>
          <input class="input" data-sales-doc-field="responsibleEmployee" value="${escapeHtml(doc.responsibleEmployee)}" />
        </label>
        ${doc.type === "ORDER" ? `
          <label class="checkbox-field sales-reserve-toggle">
            <input type="checkbox" data-sales-doc-field="reserveStock" ${doc.reserveStock ? "checked" : ""} ${!state.salesAdvancedReady ? "disabled" : ""} />
            <span>Rezervuoti prekes</span>
          </label>
        ` : ""}
        <label class="form-field notes-field">
          <span class="label">Pastabos</span>
          <textarea class="input textarea" data-sales-doc-field="notes" rows="3">${escapeHtml(doc.notes)}</textarea>
        </label>
      </div>
      <div class="lines-header">
        <h2>Prekių eilutės</h2>
        <button class="button secondary" data-action="add-sales-row"><span class="button-icon">+</span>Pridėti eilutę</button>
      </div>
      <div class="table-scroll">
        <table class="lines-table sales-lines-table">
          <thead>
            <tr>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Mato vnt.</th>
              <th class="num">Esamas</th>
              <th class="num">Rezervuota</th>
              <th class="num">Kiekis</th>
              <th class="num">Kaina be PVM</th>
              <th class="num">Nuolaida %</th>
              <th class="num">PVM %</th>
              <th class="num">Suma be PVM</th>
              <th class="num">PVM</th>
              <th class="num">Bendra</th>
              <th></th>
            </tr>
          </thead>
          <tbody data-sales-lines>
            ${doc.rows.map(renderSalesDocumentRowEditor).join("")}
          </tbody>
        </table>
      </div>
      <div class="totals-area">
        <div class="form-actions">
          <button class="button warning" data-action="save-sales-draft">Išsaugoti juodraštį</button>
          ${doc.type === "DELIVERY_NOTE" ? `<button class="button" data-action="save-confirm-delivery-note" ${!state.salesAdvancedReady ? "disabled" : ""}>Patvirtinti važtaraštį</button>` : ""}
        </div>
        <div class="totals">
          <div class="total-row"><span>Suma be PVM</span><strong data-sales-total="subtotal">${formatMoney(totals.subtotal)}</strong></div>
          <div class="total-row"><span>Nuolaidų suma</span><strong data-sales-total="discount">${formatMoney(totals.discountTotal)}</strong></div>
          <div class="total-row"><span>PVM suma</span><strong data-sales-total="vat">${formatMoney(totals.vat)}</strong></div>
          <div class="total-row strong"><span>Bendra suma</span><span data-sales-total="total">${formatMoney(totals.total)}</span></div>
          <div class="total-row"><span>Apmokėta suma</span><strong>${formatMoney(0)}</strong></div>
          <div class="total-row"><span>Skola</span><strong data-sales-total="debt">${formatMoney(totals.debt)}</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderSalesDocumentRowEditor(row) {
  const totals = salesLineTotals(row);
  return `
    <tr data-sales-row-id="${row.rowId}">
      <td>
        <div class="lookup-cell">
          <input class="cell-input" data-sales-row-field="article" value="${escapeHtml(row.article)}" placeholder="Artikulas arba pavadinimas" autocomplete="off" />
          <div class="lookup-panel" data-sales-lookup-panel>${renderSalesProductLookup(row)}</div>
        </div>
      </td>
      <td><input class="cell-input" data-sales-row-field="name" value="${escapeHtml(row.name)}" /></td>
      <td><input class="cell-input" data-sales-row-field="unit" value="${escapeHtml(row.unit)}" /></td>
      <td class="num" data-sales-row-stock>${formatNumber(row.currentStock)}</td>
      <td class="num" data-sales-row-reserved>${formatNumber(row.reservedStock)}</td>
      <td><input class="cell-input num" type="number" min="0" step="1" data-sales-row-field="quantity" value="${escapeHtml(row.quantity)}" /></td>
      <td><input class="cell-input num" type="number" min="0" step="0.01" data-sales-row-field="unitPrice" value="${escapeHtml(row.unitPrice)}" /></td>
      <td><input class="cell-input num" type="number" min="0" max="100" step="0.01" data-sales-row-field="discountPercent" value="${escapeHtml(row.discountPercent)}" /></td>
      <td><input class="cell-input num" type="number" min="0" step="1" data-sales-row-field="vatRate" value="${escapeHtml(row.vatRate)}" /></td>
      <td class="num" data-sales-row-subtotal>${formatMoney(totals.subtotal)}</td>
      <td class="num" data-sales-row-vat>${formatMoney(totals.vat)}</td>
      <td class="num" data-sales-row-total><strong>${formatMoney(totals.total)}</strong></td>
      <td class="num"><button class="remove-row" title="Pašalinti eilutę" data-action="remove-sales-row" ${state.salesDraft.rows.length === 1 ? "disabled" : ""}>×</button></td>
    </tr>
  `;
}

function renderSalesProductLookup(row) {
  if (row.lookupMatches?.length) {
    return `
      <div class="lookup-list">
        ${row.lookupMatches.map((product) => `
          <button class="lookup-option" data-action="select-sales-product" data-row-id="${row.rowId}" data-id="${product.id}">
            <strong>${escapeHtml(product.article)}</strong>
            <span>${escapeHtml(product.name)} · Laisva ${formatNumber(freeStockForProduct(product, state.salesDraft.editingId))} ${escapeHtml(product.unit)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }
  if (row.lookupMessage) return `<div class="lookup-empty"><span>${escapeHtml(row.lookupMessage)}</span></div>`;
  return "";
}

function renderSalesDocumentDetailPage() {
  if (!state.salesSchemaReady) return renderSalesSchemaNotice("Pardavimo dokumentas");
  const document = findSalesDocument(state.selectedSalesDocumentId);
  if (!document) {
    return `
      ${renderHeader("Dokumentas nerastas", "Pasirinktas pardavimo dokumentas nebeegzistuoja.")}
      <button class="button secondary" data-action="back-to-sales">Grįžti į pardavimus</button>
    `;
  }
  return `
    ${renderHeader(
      document.number,
      `${salesTypeLabel(document.type)} · ${customerName(document.customerId)}`,
      `<div class="form-actions">
        <button class="button secondary" data-action="back-to-sales">Grįžti į pardavimus</button>
        ${document.status === "DRAFT" ? `<button class="button" data-action="edit-sales-document" data-id="${document.id}">Redaguoti</button>` : ""}
        <button class="button secondary" data-action="register-payment" data-id="${document.id}" ${!state.salesAdvancedReady || document.status === "CANCELLED" || document.debt <= 0 ? "disabled" : ""}>Registruoti apmokėjimą</button>
        ${document.type === "ORDER" && document.status === "DRAFT" ? `<button class="button secondary" data-action="reserve-sales-document" data-id="${document.id}" ${!state.salesAdvancedReady ? "disabled" : ""}>Rezervuoti prekes</button>` : ""}
        ${canCancelSalesDocument(document) ? `<button class="button secondary" data-action="cancel-sales-document" data-id="${document.id}">Atšaukti dokumentą</button>` : ""}
        ${document.type === "DELIVERY_NOTE" && document.status === "DRAFT" ? `<button class="button" data-action="confirm-delivery-note" data-id="${document.id}" ${!state.salesAdvancedReady ? "disabled" : ""}>Patvirtinti važtaraštį</button>` : ""}
        ${document.type === "DELIVERY_NOTE" && document.status === "CONFIRMED" ? `<button class="button danger" data-action="cancel-delivery-note" data-id="${document.id}" ${!state.salesAdvancedReady ? "disabled" : ""}>Atšaukti važtaraštį</button>` : ""}
      </div>`,
    )}
    <section class="document-panel">
      <div class="detail-grid">
        ${detailItem("Tipas", salesTypeLabel(document.type))}
        ${detailItem("Būsena", renderSalesStatusBadge(document.status))}
        ${detailItem("Klientas", escapeHtml(customerName(document.customerId)))}
        ${detailItem("Kliento dokumento Nr.", escapeHtml(document.customerDocumentNumber || "-"))}
        ${detailItem("Data", formatDate(document.date))}
        ${detailItem("Apmokėjimo terminas", formatDate(document.dueDate))}
        ${detailItem("Valiuta", escapeHtml(document.currency))}
        ${detailItem("Atsakingas", escapeHtml(document.responsibleEmployee || "-"))}
        ${detailItem("Sukurta", formatDateTime(document.createdAt))}
        ${detailItem("Atnaujinta", formatDateTime(document.updatedAt))}
      </div>
      <div class="document-chain">${renderDocumentChain(document)}</div>
      <div class="lines-header"><h2>Prekės</h2></div>
      <div class="table-scroll">
        <table class="lines-table">
          <thead>
            <tr>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Vnt.</th>
              <th class="num">Kiekis</th>
              <th class="num">Kaina be PVM</th>
              <th class="num">Nuolaida</th>
              <th class="num">PVM</th>
              <th class="num">Bendra suma</th>
            </tr>
          </thead>
          <tbody>
            ${document.lines.map((line) => {
              const totals = salesLineTotals(line);
              return `
                <tr>
                  <td><strong>${escapeHtml(line.article)}</strong></td>
                  <td>${escapeHtml(line.name)}</td>
                  <td>${escapeHtml(line.unit)}</td>
                  <td class="num">${formatNumber(line.quantity)}</td>
                  <td class="num">${formatMoney(line.unitPrice)}</td>
                  <td class="num">${formatNumber(line.discountPercent)} %</td>
                  <td class="num">${formatMoney(totals.vat)}</td>
                  <td class="num">${formatMoney(totals.total)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="totals-area detail-totals">
        <div>
          <div class="lines-header"><h2>Mokėjimų istorija</h2></div>
          ${renderPaymentsTable(document)}
        </div>
        <div class="totals">
          <div class="total-row"><span>Suma be PVM</span><strong>${formatMoney(document.subtotal)}</strong></div>
          <div class="total-row"><span>Nuolaidos</span><strong>${formatMoney(document.discountTotal)}</strong></div>
          <div class="total-row"><span>PVM</span><strong>${formatMoney(document.vat)}</strong></div>
          <div class="total-row strong"><span>Bendra suma</span><span>${formatMoney(document.total)}</span></div>
          <div class="total-row"><span>Apmokėta</span><strong>${formatMoney(document.paidAmount)}</strong></div>
          <div class="total-row"><span>Likusi skola</span><strong>${formatMoney(document.debt)}</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderPaymentsTable(document) {
  if (!document.payments.length) return `<div class="empty-state compact-empty">Mokėjimų dar nėra.</div>`;
  return `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Būdas</th>
            <th class="num">Suma</th>
            <th>Pastabos</th>
          </tr>
        </thead>
        <tbody>
          ${document.payments.map((payment) => `
            <tr>
              <td>${formatDate(payment.paymentDate)}</td>
              <td>${PAYMENT_METHODS[payment.method] ?? payment.method}</td>
              <td class="num">${formatMoney(payment.amount)}</td>
              <td>${escapeHtml(payment.notes || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDocumentChain(document) {
  const outgoing = document.relations.filter((relation) => idsEqual(relation.source_document_id, document.id));
  const incoming = document.relations.filter((relation) => idsEqual(relation.target_document_id, document.id));
  if (!outgoing.length && !incoming.length) return `<p class="muted">Susijusių dokumentų grandinės dar nėra.</p>`;
  const links = [
    ...incoming.map((relation) => findSalesDocument(relation.source_document_id)).filter(Boolean),
    document,
    ...outgoing.map((relation) => findSalesDocument(relation.target_document_id)).filter(Boolean),
  ];
  return `
    <div class="chain-list">
      ${links.map((item, index) => `
        ${index ? `<span class="chain-arrow">→</span>` : ""}
        <button class="chain-item" data-action="view-sales-document" data-id="${item.id}">
          ${salesTypeLabel(item.type)} ${escapeHtml(item.number)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderNewDocumentPage() {
  const doc = state.newDoc;
  const totals = documentTotals(doc.rows);
  const isEditing = Boolean(doc.editingId);
  const title = isEditing ? "Redaguoti pajamavimo dokumentą" : "Naujas pajamavimo dokumentas";

  return `
    ${renderHeader(title, "Prekių priėmimas į sandėlį pagal tiekėjo dokumentą.")}
    <section class="document-panel">
      <div class="document-head document-head-expanded">
        <label class="form-field">
          <span class="label">Tiekėjas</span>
          <select class="select" data-doc-field="supplierId">
            <option value="">Pasirinkti tiekėją</option>
            ${state.suppliers
              .map(
                (supplier) => `
                  <option value="${supplier.id}" ${doc.supplierId === String(supplier.id) ? "selected" : ""}>${escapeHtml(supplier.name)}</option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="form-field">
          <span class="label">Vidinis dokumento Nr.</span>
          <input class="input readonly-input" data-doc-field="number" value="${escapeHtml(doc.number)}" readonly />
        </label>
        <label class="form-field">
          <span class="label">Tiekėjo dokumento Nr.</span>
          <input class="input" data-doc-field="supplierDocumentNumber" value="${escapeHtml(doc.supplierDocumentNumber)}" />
        </label>
        <label class="form-field">
          <span class="label">Data</span>
          <input class="input" type="date" data-doc-field="date" value="${escapeHtml(doc.date)}" />
        </label>
        <label class="form-field notes-field">
          <span class="label">Pastabos</span>
          <textarea class="input textarea" data-doc-field="notes" rows="3">${escapeHtml(doc.notes)}</textarea>
        </label>
      </div>

      <div class="lines-header">
        <h2>Prekių eilutės</h2>
        <button class="button secondary" data-action="add-doc-row"><span class="button-icon">+</span>Pridėti eilutę</button>
      </div>

      <div class="table-scroll">
        <table class="lines-table">
          <thead>
            <tr>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Vnt. matas</th>
              <th class="num">Kiekis</th>
              <th class="num">Vieneto kaina be PVM</th>
              <th class="num">Eilutės suma be PVM</th>
              <th></th>
            </tr>
          </thead>
          <tbody data-document-lines>
            ${doc.rows.map((row) => renderDocumentRow(row)).join("")}
          </tbody>
        </table>
      </div>

      <div class="totals-area">
        <div class="form-actions">
          <button class="button warning" data-action="save-draft">Išsaugoti juodraštį</button>
          <button class="button" data-action="confirm-document">Patvirtinti dokumentą</button>
        </div>
        <div class="totals">
          <div class="total-row">
            <span>Suma be PVM</span>
            <strong data-total="subtotal">${formatMoney(totals.subtotal)}</strong>
          </div>
          <div class="total-row">
            <span>PVM 21 %</span>
            <strong data-total="vat">${formatMoney(totals.vat)}</strong>
          </div>
          <div class="total-row strong">
            <span>Bendra suma</span>
            <span data-total="total">${formatMoney(totals.total)}</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDocumentRow(row) {
  return `
    <tr data-row-id="${row.rowId}">
      <td>
        <div class="lookup-cell">
          <input class="cell-input" data-row-field="article" value="${escapeHtml(row.article)}" placeholder="Artikulas arba pavadinimas" autocomplete="off" />
          <div class="lookup-panel" data-lookup-panel>${renderProductLookup(row)}</div>
        </div>
      </td>
      <td>
        <input class="cell-input" data-row-field="name" value="${escapeHtml(row.name)}" />
      </td>
      <td>
        <select class="cell-input" data-row-field="unit">
          ${["vnt.", "kompl.", "m"].map((unit) => `<option value="${unit}" ${row.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}
        </select>
      </td>
      <td>
        <input class="cell-input num" type="number" min="0" step="1" data-row-field="quantity" value="${escapeHtml(row.quantity)}" />
      </td>
      <td>
        <input class="cell-input num" type="number" min="0" step="0.01" data-row-field="unitPrice" value="${escapeHtml(row.unitPrice)}" />
      </td>
      <td class="num" data-row-sum><strong>${formatMoney(lineSubtotal(row))}</strong></td>
      <td class="num">
        <button class="remove-row" title="Pašalinti eilutę" data-action="remove-doc-row" ${state.newDoc.rows.length === 1 ? "disabled" : ""}>×</button>
      </td>
    </tr>
  `;
}

function renderProductLookup(row) {
  if (row.lookupMatches?.length) {
    return `
      <div class="lookup-list">
        ${row.lookupMatches
          .map(
            (product) => `
              <button class="lookup-option" data-action="select-product" data-row-id="${row.rowId}" data-id="${product.id}">
                <strong>${escapeHtml(product.article)}</strong>
                <span>${escapeHtml(product.name)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  }
  if (row.lookupMessage) {
    return `
      <div class="lookup-empty">
        <span>${escapeHtml(row.lookupMessage)}</span>
        <button class="mini-button" data-action="quick-create-product" data-row-id="${row.rowId}">Sukurti naują prekę</button>
      </div>
    `;
  }
  return "";
}

function renderDocumentDetailPage() {
  const document = findDocument(state.selectedDocumentId);
  if (!document) {
    return `
      ${renderHeader("Dokumentas nerastas", "Pasirinktas pajamavimo dokumentas nebeegzistuoja.")}
      <button class="button secondary" data-action="back-to-documents">Grįžti į sąrašą</button>
    `;
  }

  return `
    ${renderHeader(
      document.number,
      "Pajamavimo dokumento peržiūra.",
      `<button class="button secondary" data-action="back-to-documents">Grįžti į sąrašą</button>`,
    )}
    <section class="document-panel">
      <div class="detail-actions">
        ${document.status === STATUS_DRAFT ? `<button class="button secondary" data-action="edit-document" data-id="${document.id}">Redaguoti</button>` : ""}
        ${document.status === STATUS_DRAFT ? `<button class="button" data-action="confirm-existing-document" data-id="${document.id}">Patvirtinti</button>` : ""}
        ${document.status === STATUS_CONFIRMED ? `<button class="button danger" data-action="cancel-document" data-id="${document.id}">Atšaukti</button>` : ""}
      </div>
      <div class="detail-grid">
        ${detailItem("Dokumento numeris", document.number)}
        ${detailItem("Būsena", renderStatusBadge(document.status))}
        ${detailItem("Tiekėjas", supplierName(document.supplierId))}
        ${detailItem("Tiekėjo dokumento Nr.", document.supplierDocumentNumber || "-")}
        ${detailItem("Data", formatDate(document.date))}
        ${detailItem("Sukūrimo data", formatDateTime(document.createdAt))}
        ${detailItem(
          document.status === STATUS_CANCELLED ? "Atšaukimo data" : "Patvirtinimo data",
          document.status === STATUS_CANCELLED ? formatDateTime(document.cancelledAt) : formatDateTime(document.confirmedAt),
        )}
        ${detailItem("Pastabos", document.notes || "-")}
      </div>
      <div class="lines-header">
        <h2>Prekės</h2>
      </div>
      <div class="table-scroll">
        <table class="lines-table">
          <thead>
            <tr>
              <th>Artikulas</th>
              <th>Pavadinimas</th>
              <th>Vnt. matas</th>
              <th class="num">Kiekis</th>
              <th class="num">Vieneto kaina be PVM</th>
              <th class="num">Eilutės suma be PVM</th>
            </tr>
          </thead>
          <tbody>
            ${document.lines
              .map(
                (line) => `
                  <tr>
                    <td><strong>${escapeHtml(line.article)}</strong></td>
                    <td>${escapeHtml(line.name)}</td>
                    <td>${escapeHtml(line.unit)}</td>
                    <td class="num">${formatNumber(line.quantity)}</td>
                    <td class="num">${formatMoney(line.unitPrice)}</td>
                    <td class="num">${formatMoney(lineSubtotal(line))}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="totals-area detail-totals">
        <span></span>
        <div class="totals">
          <div class="total-row">
            <span>Suma be PVM</span>
            <strong>${formatMoney(document.subtotal)}</strong>
          </div>
          <div class="total-row">
            <span>PVM 21 %</span>
            <strong>${formatMoney(document.vat)}</strong>
          </div>
          <div class="total-row strong">
            <span>Bendra suma</span>
            <span>${formatMoney(document.total)}</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderProductDatalist() {
  return `
    <datalist id="product-articles">
      ${activeProducts()
        .map(
          (product) =>
            `<option value="${escapeHtml(product.article)}">${escapeHtml(product.name)}</option>`,
        )
        .join("")}
    </datalist>
  `;
}

function renderModal() {
  if (state.modal.type === "confirm") return renderConfirmModal();
  if (state.modal.type === "product") return renderProductModal();
  if (state.modal.type === "supplier") return renderSupplierModal();
  if (state.modal.type === "customer") return renderCustomerModal();
  if (state.modal.type === "payment") return renderPaymentModal();
  if (state.modal.type === "debt-reminder") return renderDebtReminderModal();
  return "";
}

function renderConfirmModal() {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal small-modal">
        <div class="modal-header">
          <h2>${escapeHtml(state.modal.title)}</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">${escapeHtml(state.modal.message)}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Atšaukti</button>
          <button type="button" class="button ${state.modal.danger ? "danger" : ""}" data-action="${state.modal.confirmAction}" data-id="${state.modal.documentId ?? ""}">${escapeHtml(state.modal.confirmLabel)}</button>
        </div>
      </div>
    </div>
  `;
}

function renderProductModal() {
  const product = state.modal.data;
  const title = state.modal.mode === "add" ? "Pridėti prekę" : "Redaguoti prekę";

  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal" data-form="product">
        <div class="modal-header">
          <h2>${title}</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            ${modalInput("Artikulas", "article", product.article)}
            ${modalInput("Pavadinimas", "name", product.name)}
            ${modalInput("Gamintojas", "manufacturer", product.manufacturer)}
            ${modalInput("Kategorija", "category", product.category)}
            ${modalInput("Sandėlis", "warehouse", product.warehouse)}
            ${modalInput("Vnt. matas", "unit", product.unit)}
            ${modalInput("Likutis", "stock", product.stock, "number", "1")}
            ${modalInput("Savikaina", "cost", product.cost, "number", "0.01")}
            ${modalInput("Pardavimo kaina", "price", product.price, "number", "0.01")}
            ${modalInput("PVM", "vat", product.vat, "number", "1")}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Atšaukti</button>
          <button class="button" type="submit">Išsaugoti</button>
        </div>
      </form>
    </div>
  `;
}

function renderSupplierModal() {
  const supplier = state.modal.data;
  const title = state.modal.mode === "add" ? "Pridėti tiekėją" : "Redaguoti tiekėją";

  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal" data-form="supplier">
        <div class="modal-header">
          <h2>${title}</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            ${modalInput("Tiekėjas", "name", supplier.name)}
            ${modalInput("Įmonės kodas", "code", supplier.code)}
            ${modalInput("El. paštas", "email", supplier.email, "email")}
            ${modalInput("Telefonas", "phone", supplier.phone)}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Atšaukti</button>
          <button class="button" type="submit">Išsaugoti</button>
        </div>
      </form>
    </div>
  `;
}

function renderCustomerModal() {
  const customer = state.modal.data;
  const title = state.modal.mode === "add" ? "Pridėti klientą" : "Redaguoti klientą";
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal" data-form="customer">
        <div class="modal-header">
          <h2>${title}</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="form-field">
              <span class="label">Kliento tipas</span>
              <select class="select" name="type">
                <option value="COMPANY" ${customer.type === "COMPANY" ? "selected" : ""}>Įmonė</option>
                <option value="PERSON" ${customer.type === "PERSON" ? "selected" : ""}>Fizinis asmuo</option>
              </select>
            </label>
            ${modalInput("Įmonės pavadinimas arba vardas ir pavardė", "name", customer.name)}
            ${modalInput("Įmonės kodas", "companyCode", customer.companyCode)}
            ${modalInput("PVM mokėtojo kodas", "vatCode", customer.vatCode)}
            ${modalInput("Adresas", "address", customer.address)}
            ${modalInput("El. paštas", "email", customer.email, "email")}
            ${modalInput("Telefonas", "phone", customer.phone)}
            ${modalInput("Kontaktinis asmuo", "contactPerson", customer.contactPerson)}
            <label class="form-field notes-field">
              <span class="label">Pastabos</span>
              <textarea class="input textarea" name="notes" rows="3">${escapeHtml(customer.notes)}</textarea>
            </label>
            <label class="checkbox-field">
              <input type="checkbox" name="isActive" ${customer.isActive ? "checked" : ""} />
              <span>Aktyvus</span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Atšaukti</button>
          <button class="button" type="submit">Išsaugoti</button>
        </div>
      </form>
    </div>
  `;
}

function renderPaymentModal() {
  const payment = state.modal.data;
  const document = findSalesDocument(payment.documentId);
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal small-modal" data-form="payment" novalidate>
        <div class="modal-header">
          <h2>Registruoti apmokėjimą</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid one-column-form">
            <div class="auth-message">Likusi skola: ${formatMoney(document?.debt ?? 0)}</div>
            <input type="hidden" name="documentId" value="${escapeHtml(payment.documentId)}" />
            ${modalInput("Mokėjimo data", "paymentDate", payment.paymentDate, "date")}
            ${modalInput("Suma", "amount", payment.amount, "number", "0.01")}
            <label class="form-field">
              <span class="label">Mokėjimo būdas</span>
              <select class="select" name="method">
                ${Object.entries(PAYMENT_METHODS).map(([method, label]) => `<option value="${method}" ${payment.method === method ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            <label class="form-field">
              <span class="label">Pastabos</span>
              <textarea class="input textarea" name="notes" rows="3">${escapeHtml(payment.notes)}</textarea>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Atšaukti</button>
          <button class="button" type="submit">Išsaugoti mokėjimą</button>
        </div>
      </form>
    </div>
  `;
}

function renderDebtReminderModal() {
  const reminder = state.modal.data;
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal wide-modal">
        <div class="modal-header">
          <h2>Skolos priminimas</h2>
          <button type="button" class="close-button" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="auth-message success-message">Tekstas sugeneruotas automatiškai. Patikrinkite prieš siųsdami klientui.</div>
          <label class="form-field">
            <span class="label">Paruoštas tekstas</span>
            <textarea class="input textarea reminder-textarea" data-reminder-text rows="12" readonly>${escapeHtml(reminder.text)}</textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="button secondary" data-action="close-modal">Uždaryti</button>
          <button type="button" class="button" data-action="copy-debt-reminder">Kopijuoti tekstą</button>
        </div>
      </div>
    </div>
  `;
}

function modalInput(label, name, value, type = "text", step = "") {
  return `
    <label class="form-field">
      <span class="label">${label}</span>
      <input class="input" name="${name}" type="${type}" ${step ? `step="${step}"` : ""} value="${escapeHtml(value)}" required />
    </label>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.salesTab) state.salesTab = button.dataset.salesTab;
      if (button.dataset.page === "new-sales-document") state.salesDraft = blankSalesDocument(state.salesTab);
      setPage(button.dataset.page);
    });
  });

  bindActionButtons(document);
  bindUnsavedFormRetention();

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.documentFilters[input.dataset.filter] = input.value;
      render();
    });
  });

  document.querySelectorAll("[data-doc-field]").forEach((input) => {
    input.addEventListener("input", () => updateDocumentField(input));
  });

  document.querySelectorAll("[data-sales-doc-field]").forEach((input) => {
    input.addEventListener("input", () => updateSalesDocumentField(input));
    input.addEventListener("change", () => updateSalesDocumentField(input));
  });

  document.querySelectorAll("[data-row-field]").forEach((input) => {
    input.addEventListener("input", () => updateDocumentRow(input));
    input.addEventListener("change", () => updateDocumentRow(input));
  });

  document.querySelectorAll("[data-sales-row-field]").forEach((input) => {
    input.addEventListener("input", () => updateSalesDocumentRow(input));
    input.addEventListener("change", () => updateSalesDocumentRow(input));
  });

  document.querySelector("[data-product-search]")?.addEventListener("input", (event) => {
    state.productQuery = event.target.value;
    refreshProductsTable();
  });

  bindPriceImportEvents();

  document.querySelector("[data-global-search]")?.addEventListener("input", (event) => {
    state.globalSearchQuery = event.target.value;
    render();
  });

  document.querySelector("[data-numbering-date]")?.addEventListener("change", (event) => {
    state.numberingDate = event.target.value ? `${event.target.value}-01` : todayDate();
    render();
  });

  document.querySelectorAll("[data-vat-filter]").forEach((input) => {
    const handler = () => {
      state.vatFilters[input.dataset.vatFilter] = input.value;
      render();
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelector("[data-customer-debt-search]")?.addEventListener("input", (event) => {
    state.customerDebtQuery = event.target.value;
    render();
  });

  document.querySelector("[data-stock-history-search]")?.addEventListener("input", (event) => {
    state.stockHistoryQuery = event.target.value;
    render();
  });

  document.querySelector("[data-customer-search]")?.addEventListener("input", (event) => {
    state.customerQuery = event.target.value;
    render();
  });

  document.querySelectorAll("[data-sales-filter]").forEach((input) => {
    const handler = () => {
      const field = input.dataset.salesFilter;
      state.salesFilters[field] = input.type === "checkbox" ? input.checked : input.value;
      state.salesPagination.page = 1;
      render();
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelector("[data-sales-search]")?.addEventListener("input", (event) => {
    state.salesQuery = event.target.value;
    state.salesPagination.page = 1;
    render();
  });

  document.querySelector("[data-sales-page-size]")?.addEventListener("change", (event) => {
    state.salesPagination.pageSize = Number(event.target.value) || 20;
    state.salesPagination.page = 1;
    render();
  });

  document.querySelector('form[data-form="auth-login"]')?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void signInWithPassword(String(formData.get("email") ?? "").trim(), String(formData.get("password") ?? ""));
  });

  document.querySelectorAll('form[data-form]:not([data-form="auth-login"])').forEach((form) => {
    form.addEventListener("submit", (event) => void handleModalSubmit(event));
  });

  document.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) {
      state.modal = null;
      render();
    }
  });
}

function bindActionButtons(scope) {
  scope.querySelectorAll("button[data-action]").forEach((element) => {
    if (state.isSaving && element.dataset.action !== "close-modal") {
      element.disabled = true;
    }
    element.addEventListener("click", (event) => void handleAction(event));
  });
}

function bindUnsavedFormRetention() {
  document
    .querySelectorAll('form[data-form="accounting-settings"] input[name], form[data-form="accounting-settings"] select[name], form[data-form="accounting-settings"] textarea[name]')
    .forEach((input) => {
      const handler = () => {
        state.accountingSettings[input.name] = formInputValue(input);
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

  document
    .querySelectorAll('form.modal[data-form] input[name], form.modal[data-form] select[name], form.modal[data-form] textarea[name]')
    .forEach((input) => {
      const handler = () => {
        if (!state.modal?.data || !input.name) return;
        state.modal.data[input.name] = formInputValue(input);
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });
}

function bindPriceImportEvents() {
  document.querySelector("[data-price-import-text]")?.addEventListener("input", (event) => {
    state.priceImport.text = event.target.value;
  });

  document.querySelector("[data-price-import-file]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.priceImport.errors = [];
      state.priceImport.text = await readPriceImportFile(file);
      parseCurrentPriceImport();
      setToast(`Failas „${file.name}“ nuskaitytas.`);
    } catch (error) {
      state.priceImport.rows = [];
      state.priceImport.errors = [error.message || "Nepavyko nuskaityti kainininko failo."];
      setToast("Nepavyko nuskaityti kainininko failo.");
    } finally {
      render();
    }
  });

  document.querySelectorAll("[data-price-import-option]").forEach((input) => {
    input.addEventListener("change", () => {
      state.priceImport.options[input.dataset.priceImportOption] = input.checked;
      if (state.priceImport.rows.length || state.priceImport.text.trim()) {
        parseCurrentPriceImport({ preserveColumns: true });
      }
      render();
    });
  });

  document.querySelectorAll("[data-price-import-column]").forEach((input) => {
    input.addEventListener("change", () => {
      state.priceImport.columns[input.dataset.priceImportColumn] = Number(input.value);
      parseCurrentPriceImport({ preserveColumns: true });
      render();
    });
  });
}

function formInputValue(input) {
  if (input.type === "checkbox") return input.checked;
  return input.value;
}

function updateDocumentField(input) {
  const field = input.dataset.docField;
  const previousDate = state.newDoc.date;
  state.newDoc[field] = input.value;
  if (field === "date" && !state.newDoc.editingId && input.value && previousDate.slice(0, 7) !== input.value.slice(0, 7)) {
    state.newDoc.number = nextDocumentNumber(input.value);
    const numberInput = document.querySelector('[data-doc-field="number"]');
    if (numberInput) numberInput.value = state.newDoc.number;
  }
}

async function handleAction(event) {
  if (state.isSaving) return;
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  if (event.currentTarget.closest(".global-search-results")) {
    state.globalSearchQuery = "";
  }

  if (action === "add-product") openProductModal();
  if (action === "set-product-status-filter") {
    state.productStatusFilter = event.currentTarget.dataset.status || "active";
    render();
    return;
  }
  if (action === "set-product-stock-filter") {
    state.productStockFilter = event.currentTarget.dataset.stockFilter || "all";
    render();
    return;
  }
  if (action === "parse-price-import") {
    parseCurrentPriceImport({ notify: true });
    return;
  }
  if (action === "apply-price-import") {
    await applyPriceImport();
    return;
  }
  if (action === "clear-price-import") {
    resetPriceImport();
    setToast("Kainininko importas išvalytas.");
    return;
  }
  if (action === "download-price-template") {
    downloadPriceTemplate();
    setToast("Kainininko šablonas paruoštas.");
    return;
  }
  if (action === "quick-new-receipt") {
    state.newDoc = blankDocument();
    state.page = "new-document";
  }
  if (action === "prepare-low-stock-receipt") {
    prepareLowStockReceiptDraft();
    return;
  }
  if (action === "quick-new-invoice") {
    state.salesTab = "INVOICE";
    state.salesDraft = blankSalesDocument("INVOICE");
    state.page = "new-sales-document";
  }
  if (action === "quick-new-customer") {
    openCustomerModal();
  }
  if (action === "go-low-stock") {
    state.productStatusFilter = "active";
    state.productStockFilter = "low";
    state.productQuery = "";
    state.page = "products";
  }
  if (action === "go-customer-debts") {
    state.customerDebtQuery = "";
    state.page = "customer-debts";
  }
  if (action === "prepare-first-debt-reminder") {
    const row = workCenterSummary().overdueRows[0] ?? customerDebtSummaries()[0];
    if (row) openDebtReminderModal(row.customer.id);
    return;
  }
  if (action === "prepare-debt-reminder") {
    openDebtReminderModal(id);
    return;
  }
  if (action === "copy-debt-reminder") {
    await copyDebtReminder();
    return;
  }
  if (action === "go-receipt-drafts") {
    state.documentFilters = { from: "", to: "", supplierId: "", status: STATUS_DRAFT, number: "" };
    state.page = "documents";
  }
  if (action === "go-sales-drafts") {
    const firstDraft = state.salesDocuments.find((document) => document.status === "DRAFT");
    if (firstDraft) state.salesTab = firstDraft.type;
    state.salesFilters = { number: "", customerId: "", type: firstDraft?.type ?? "", status: "DRAFT", from: "", to: "", unpaidOnly: false, responsible: "" };
    state.salesQuery = "";
    state.salesPagination.page = 1;
    state.page = "sales";
  }
  if (action === "go-delivery-drafts") {
    state.salesTab = "DELIVERY_NOTE";
    state.salesFilters = { number: "", customerId: "", type: "DELIVERY_NOTE", status: "DRAFT", from: "", to: "", unpaidOnly: false, responsible: "" };
    state.salesQuery = "";
    state.salesPagination.page = 1;
    state.page = "sales";
  }
  if (action === "go-accounting-settings") {
    state.page = "accounting-settings";
  }
  if (action === "go-isaf-month") {
    state.vatFilters = { from: monthStartDate(), to: todayDate(), register: "ALL" };
    state.page = "isaf-export";
  }
  if (action === "go-vat-month") {
    state.vatFilters = { from: monthStartDate(), to: todayDate(), register: "ALL" };
    state.page = "vat-registers";
  }
  if (action === "go-products-no-price") {
    state.productStatusFilter = "active";
    state.productStockFilter = "no-price";
    state.productQuery = "";
    state.page = "products";
  }
  if (action === "go-products-no-cost") {
    state.productStatusFilter = "active";
    state.productStockFilter = "no-cost";
    state.productQuery = "";
    state.page = "products";
  }
  if (action === "go-customers") {
    state.customerQuery = "";
    state.page = "customers";
  }
  if (action === "go-receipts") {
    state.documentFilters = { from: "", to: "", supplierId: "", status: "", number: "" };
    state.page = "documents";
  }
  if (action === "add-customer") openCustomerModal();
  if (action === "edit-customer") openCustomerModal(state.customers.find((item) => idsEqual(item.id, id)));
  if (action === "view-customer") {
    state.selectedCustomerId = id;
    state.page = "customer-detail";
  }
  if (action === "sign-out") {
    await signOut();
    return;
  }
  if (action === "download-vat-csv") {
    downloadVatCsv();
    return;
  }
  if (action === "download-isaf-xml") {
    downloadIsafXml();
    return;
  }
  if (action === "edit-product") openProductModal(state.products.find((item) => idsEqual(item.id, id)));
  if (action === "view-product") {
    state.selectedProductId = id;
    state.page = "product-detail";
  }
  if (action === "delete-product") {
    requestDeleteProduct(id);
    return;
  }
  if (action === "do-delete-product") {
    state.modal = null;
    await deleteProduct(id);
    return;
  }
  if (action === "restore-product") {
    requestRestoreProduct(id);
    return;
  }
  if (action === "do-restore-product") {
    state.modal = null;
    await restoreProduct(id);
    return;
  }
  if (action === "add-supplier") openSupplierModal();
  if (action === "edit-supplier") openSupplierModal(state.suppliers.find((item) => idsEqual(item.id, id)));

  if (action === "new-sales-document") {
    state.salesDraft = blankSalesDocument(state.salesTab);
    state.page = "new-sales-document";
  }

  if (action === "add-sales-row") {
    state.salesDraft.rows.push(blankSalesRow());
  }

  if (action === "remove-sales-row") {
    const rowId = event.currentTarget.closest("tr").dataset.salesRowId;
    state.salesDraft.rows = state.salesDraft.rows.filter((row) => row.rowId !== rowId);
  }

  if (action === "select-sales-product") {
    selectSalesProductForRow(event.currentTarget.dataset.rowId, id);
    return;
  }

  if (action === "save-sales-draft") {
    await saveSalesDraft();
    return;
  }

  if (action === "save-confirm-delivery-note") {
    requestSaveAndConfirmDeliveryNote();
    return;
  }

  if (action === "do-save-confirm-delivery-note") {
    state.modal = null;
    await saveAndConfirmDeliveryNote();
    return;
  }

  if (action === "view-sales-document") {
    state.selectedSalesDocumentId = id;
    state.page = "sales-document-detail";
  }

  if (action === "edit-sales-document") {
    loadSalesDocumentForEdit(id);
  }

  if (action === "copy-sales-document") {
    copySalesDocument(id);
  }

  if (action === "convert-sales-document") {
    requestConvertSalesDocument(id, event.currentTarget.dataset.targetType);
    return;
  }

  if (action === "do-convert-sales-document") {
    state.modal = null;
    convertSalesDocument(state.pendingConversion?.sourceId, state.pendingConversion?.targetType);
    state.pendingConversion = null;
    return;
  }

  if (action === "confirm-delivery-note") {
    requestConfirmDeliveryNote(id);
    return;
  }

  if (action === "do-confirm-delivery-note") {
    state.modal = null;
    await confirmDeliveryNote(id);
    return;
  }

  if (action === "cancel-delivery-note") {
    requestCancelDeliveryNote(id);
    return;
  }

  if (action === "do-cancel-delivery-note") {
    state.modal = null;
    await cancelDeliveryNote(id);
    return;
  }

  if (action === "reserve-sales-document") {
    await reserveSalesDocument(id);
    return;
  }

  if (action === "cancel-sales-document") {
    requestCancelSalesDocument(id);
    return;
  }

  if (action === "do-cancel-sales-document") {
    state.modal = null;
    await cancelSalesDocument(id);
    return;
  }

  if (action === "delete-sales-draft") {
    requestDeleteSalesDraft(id);
    return;
  }

  if (action === "do-delete-sales-draft") {
    state.modal = null;
    await deleteSalesDraft(id);
    return;
  }

  if (action === "register-payment") {
    openPaymentModal(id);
  }

  if (action === "sort-sales") {
    const field = event.currentTarget.dataset.sort;
    if (state.salesSort.field === field) {
      state.salesSort.direction = state.salesSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.salesSort = { field, direction: "asc" };
    }
  }

  if (action === "sales-prev-page") {
    state.salesPagination.page = Math.max(1, state.salesPagination.page - 1);
  }

  if (action === "sales-next-page") {
    const totalPages = Math.max(1, Math.ceil(filteredSalesDocuments().length / state.salesPagination.pageSize));
    state.salesPagination.page = Math.min(totalPages, state.salesPagination.page + 1);
  }

  if (action === "clear-sales-filters") {
    state.salesFilters = { number: "", customerId: "", type: "", status: "", from: "", to: "", unpaidOnly: false, responsible: "" };
    state.salesQuery = "";
    state.salesPagination.page = 1;
  }

  if (action === "export-sales-excel") exportSalesExcel();
  if (action === "print-sales-pdf" || action === "print-sales-document") window.print();

  if (action === "close-modal") {
    state.modal = null;
  }

  if (action === "new-document") {
    state.newDoc = blankDocument();
    state.page = "new-document";
  }

  if (action === "add-doc-row") {
    state.newDoc.rows.push(blankRow());
  }

  if (action === "remove-doc-row") {
    const rowId = event.currentTarget.closest("tr").dataset.rowId;
    state.newDoc.rows = state.newDoc.rows.filter((row) => row.rowId !== rowId);
  }

  if (action === "select-product") {
    selectProductForRow(event.currentTarget.dataset.rowId, id);
    return;
  }

  if (action === "quick-create-product") {
    const row = state.newDoc.rows.find((item) => item.rowId === event.currentTarget.dataset.rowId);
    state.pendingProductRowId = row?.rowId ?? null;
    openProductModal({
      id: null,
      article: row?.article ?? "",
      name: row?.name ?? "",
      manufacturer: "",
      category: "",
      warehouse: "Vilnius",
      stock: 0,
      unit: row?.unit ?? "vnt.",
      cost: Number(row?.unitPrice) || 0,
      price: Number(row?.unitPrice) ? Number(row.unitPrice) * 1.35 : 0,
      vat: 21,
    });
  }

  if (action === "save-draft") {
    await saveDocumentDraft();
    return;
  }

  if (action === "confirm-document") {
    requestConfirmNewDocument();
    return;
  }

  if (action === "do-confirm-new-document") {
    state.modal = null;
    await saveAndConfirmDocument();
    return;
  }

  if (action === "view-document") {
    state.selectedDocumentId = id;
    state.page = "document-detail";
  }

  if (action === "edit-document") {
    loadDocumentForEdit(id);
  }

  if (action === "confirm-existing-document") {
    requestConfirmExistingDocument(id);
    return;
  }

  if (action === "do-confirm-existing-document") {
    state.modal = null;
    await confirmExistingDocument(id);
    return;
  }

  if (action === "cancel-document") {
    requestCancelDocument(id);
    return;
  }

  if (action === "do-cancel-document") {
    state.modal = null;
    await cancelDocument(id);
    return;
  }

  if (action === "delete-document") {
    requestDeleteDocument(id);
    return;
  }

  if (action === "do-delete-document") {
    state.modal = null;
    await deleteDraftDocument(id);
    return;
  }

  if (action === "back-to-documents") {
    state.page = "documents";
    state.selectedDocumentId = null;
  }

  if (action === "back-to-products") {
    state.page = "products";
    state.selectedProductId = null;
  }

  if (action === "back-to-customers") {
    state.page = "customers";
    state.selectedCustomerId = null;
  }

  if (action === "back-to-sales") {
    state.page = "sales";
    state.selectedSalesDocumentId = null;
  }

  if (action === "clear-document-filters") {
    state.documentFilters = { from: "", to: "", supplierId: "", status: "", number: "" };
  }

  render();
}

function openProductModal(product) {
  state.modal = {
    type: "product",
    mode: product?.id ? "edit" : "add",
    data: {
      id: product?.id ?? null,
      article: product?.article ?? "",
      name: product?.name ?? "",
      manufacturer: product?.manufacturer ?? "",
      category: product?.category ?? "",
      warehouse: product?.warehouse ?? "Vilnius",
      stock: product?.stock ?? 0,
      unit: product?.unit ?? "vnt.",
      cost: product?.cost ?? 0,
      price: product?.price ?? 0,
      vat: product?.vat ?? 21,
      isActive: product?.isActive ?? true,
    },
  };
}

function openSupplierModal(supplier) {
  state.modal = {
    type: "supplier",
    mode: supplier?.id ? "edit" : "add",
    data: {
      id: supplier?.id ?? null,
      name: supplier?.name ?? "",
      code: supplier?.code ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
    },
  };
}

function openCustomerModal(customer) {
  state.modal = {
    type: "customer",
    mode: customer?.id ? "edit" : "add",
    data: {
      id: customer?.id ?? null,
      type: customer?.type ?? "COMPANY",
      name: customer?.name ?? "",
      companyCode: customer?.companyCode ?? "",
      vatCode: customer?.vatCode ?? "",
      address: customer?.address ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      contactPerson: customer?.contactPerson ?? "",
      notes: customer?.notes ?? "",
      isActive: customer?.isActive ?? true,
    },
  };
}

function openPaymentModal(documentId) {
  const document = findSalesDocument(documentId);
  if (!document) return;
  if (!state.salesAdvancedReady) {
    setToast("Mokėjimų registravimui reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return;
  }
  state.modal = {
    type: "payment",
    data: {
      documentId,
      paymentDate: todayDate(),
      amount: document.debt || 0,
      method: "BANK_TRANSFER",
      notes: "",
    },
  };
}

function requestConfirmation({ title, message, confirmAction, confirmLabel, documentId = "", danger = false }) {
  state.modal = { type: "confirm", title, message, confirmAction, confirmLabel, documentId, danger };
  render();
}

function requestConfirmNewDocument() {
  if (!validateCurrentDocument()) return;
  requestConfirmation({
    title: "Patvirtinti dokumentą",
    message:
      "Ar tikrai norite patvirtinti dokumentą? Patvirtinus prekių likučiai sandėlyje bus padidinti.",
    confirmAction: "do-confirm-new-document",
    confirmLabel: "Patvirtinti dokumentą",
  });
}

function requestConfirmExistingDocument(id) {
  requestConfirmation({
    title: "Patvirtinti dokumentą",
    message:
      "Ar tikrai norite patvirtinti dokumentą? Patvirtinus prekių likučiai sandėlyje bus padidinti.",
    confirmAction: "do-confirm-existing-document",
    confirmLabel: "Patvirtinti dokumentą",
    documentId: id,
  });
}

function requestCancelDocument(id) {
  requestConfirmation({
    title: "Atšaukti dokumentą",
    message:
      "Ar tikrai norite atšaukti dokumentą? Sandėlio likučiai bus sumažinti tais kiekiais, kurie buvo pridėti patvirtinant.",
    confirmAction: "do-cancel-document",
    confirmLabel: "Atšaukti dokumentą",
    documentId: id,
    danger: true,
  });
}

function requestDeleteDocument(id) {
  requestConfirmation({
    title: "Ištrinti juodraštį",
    message: "Ar tikrai norite ištrinti šį juodraštį? Veiksmo atšaukti nepavyks.",
    confirmAction: "do-delete-document",
    confirmLabel: "Ištrinti",
    documentId: id,
    danger: true,
  });
}

function requestDeleteProduct(id) {
  const product = findProduct(id);
  if (!product) return;
  const blockedMessage = productDeleteBlockMessage(product);
  if (blockedMessage) {
    setToast(blockedMessage);
    return;
  }
  const stockWarning =
    Number(product.stock) > 0
      ? ` Ši prekė turi ${formatNumber(product.stock)} ${product.unit || "vnt."} likutį, todėl jis nebebus rodomas aktyviuose likučiuose.`
      : "";
  requestConfirmation({
    title: "Pašalinti prekę",
    message: `Ar tikrai norite pašalinti prekę ${product.article} · ${product.name}? Prekė bus paslėpta iš aktyvaus sąrašo, tačiau dokumentų ir likučių istorija išliks.${stockWarning}`,
    confirmAction: "do-delete-product",
    confirmLabel: "Pašalinti prekę",
    documentId: id,
    danger: true,
  });
}

function requestRestoreProduct(id) {
  const product = findProduct(id);
  if (!product) return;
  requestConfirmation({
    title: "Grąžinti prekę",
    message: `Ar grąžinti prekę ${product.article} · ${product.name} į aktyvų prekių sąrašą? Ji vėl bus matoma naujuose dokumentuose ir prekių paieškoje.`,
    confirmAction: "do-restore-product",
    confirmLabel: "Grąžinti",
    documentId: id,
  });
}

function requestSaveAndConfirmDeliveryNote() {
  if (!state.salesAdvancedReady) {
    setToast("Važtaraščio patvirtinimui reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return;
  }
  if (!validateCurrentSalesDocument()) return;
  requestConfirmation({
    title: "Patvirtinti važtaraštį",
    message: "Ar tikrai norite patvirtinti važtaraštį? Tik šis veiksmas sumažins faktinį sandėlio likutį.",
    confirmAction: "do-save-confirm-delivery-note",
    confirmLabel: "Patvirtinti važtaraštį",
  });
}

function requestConfirmDeliveryNote(id) {
  if (!state.salesAdvancedReady) {
    setToast("Važtaraščio patvirtinimui reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return;
  }
  requestConfirmation({
    title: "Patvirtinti važtaraštį",
    message: "Ar tikrai norite patvirtinti važtaraštį? Sistema patikrins likučius ir sumažins juos vienoje duomenų bazės transakcijoje.",
    confirmAction: "do-confirm-delivery-note",
    confirmLabel: "Patvirtinti važtaraštį",
    documentId: id,
  });
}

function requestCancelDeliveryNote(id) {
  if (!state.salesAdvancedReady) {
    setToast("Važtaraščio atšaukimui reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return;
  }
  requestConfirmation({
    title: "Atšaukti važtaraštį",
    message: "Ar tikrai norite atšaukti važtaraštį? Prekės bus grąžintos į sandėlį, istorijos įrašai nebus trinami.",
    confirmAction: "do-cancel-delivery-note",
    confirmLabel: "Atšaukti važtaraštį",
    documentId: id,
    danger: true,
  });
}

function requestCancelSalesDocument(id) {
  requestConfirmation({
    title: "Atšaukti pardavimo dokumentą",
    message: "Ar tikrai norite atšaukti dokumentą? Faktinis likutis nesikeis, nebent tai patvirtintas važtaraštis.",
    confirmAction: "do-cancel-sales-document",
    confirmLabel: "Atšaukti dokumentą",
    documentId: id,
    danger: true,
  });
}

function requestDeleteSalesDraft(id) {
  requestConfirmation({
    title: "Ištrinti pardavimo juodraštį",
    message: "Ar tikrai norite ištrinti šį pardavimo juodraštį? Veiksmo atšaukti nepavyks.",
    confirmAction: "do-delete-sales-draft",
    confirmLabel: "Ištrinti juodraštį",
    documentId: id,
    danger: true,
  });
}

function requestConvertSalesDocument(id, targetType) {
  const source = findSalesDocument(id);
  if (!source || !targetType) return;
  const duplicate = state.salesDocuments.some((document) =>
    document.type === targetType &&
    document.relations.some((relation) => idsEqual(relation.source_document_id, source.id)),
  );
  state.pendingConversion = { sourceId: id, targetType };
  requestConfirmation({
    title: `Konvertuoti į ${salesTypeLabel(targetType)}`,
    message: duplicate
      ? "Jau yra sukurtas toks susijęs dokumentas. Ar tikrai norite kurti dar vieną kopiją?"
      : `Bus nukopijuotas klientas, prekės, kainos, nuolaidos, PVM ir pastabos iš dokumento ${source.number}.`,
    confirmAction: "do-convert-sales-document",
    confirmLabel: "Konvertuoti",
    danger: duplicate,
  });
}

async function handleModalSubmit(event) {
  event.preventDefault();
  if (state.isSaving) return;
  const form = event.currentTarget;
  const formData = new FormData(form);

  if (form.dataset.form === "accounting-settings") {
    const settings = {
      id: "main",
      companyName: String(formData.get("companyName") ?? "").trim(),
      companyCode: String(formData.get("companyCode") ?? "").trim(),
      vatCode: String(formData.get("vatCode") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      defaultCurrency: "EUR",
      softwareName: String(formData.get("softwareName") ?? "").trim(),
      softwareVersion: String(formData.get("softwareVersion") ?? "").trim(),
    };
    if (!settings.companyName || !settings.companyCode || !settings.vatCode) {
      setToast("Užpildykite įmonės pavadinimą, įmonės kodą ir PVM kodą.");
      return;
    }
    await runSaving(async () => {
      state.accountingSettings = await database.saveAccountingSettings(settings);
      setToast("Įmonės nustatymai išsaugoti.");
    });
    return;
  }

  if (form.dataset.form === "product") {
    const mode = state.modal.mode;
    const product = {
      id: state.modal.data.id || null,
      article: formData.get("article").trim(),
      name: formData.get("name").trim(),
      manufacturer: formData.get("manufacturer").trim(),
      category: formData.get("category").trim(),
      warehouse: formData.get("warehouse").trim(),
      stock: Number(formData.get("stock")) || 0,
      unit: formData.get("unit").trim() || "vnt.",
      cost: Number(formData.get("cost")) || 0,
      price: Number(formData.get("price")) || 0,
      vat: Number(formData.get("vat")) || 0,
      isActive: state.modal.data.isActive !== false,
    };
    await runSaving(async () => {
      const savedProduct = await database.saveProduct(product);
      upsert(state.products, savedProduct);
      applyPendingProductToRow(savedProduct);
      state.modal = null;
      setToast(mode === "add" ? "Prekė pridėta." : "Prekė atnaujinta.");
    });
    return;
  }

  if (form.dataset.form === "supplier") {
    const supplier = {
      id: state.modal.data.id || null,
      name: formData.get("name").trim(),
      code: formData.get("code").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim(),
    };
    const mode = state.modal.mode;
    await runSaving(async () => {
      await database.saveSupplier(supplier);
      state.modal = null;
      await reloadAllData();
      setToast(mode === "add" ? "Tiekėjas pridėtas." : "Tiekėjas atnaujintas.");
    });
    return;
  }

  if (form.dataset.form === "customer") {
    const customer = {
      id: state.modal.data.id || null,
      type: formData.get("type"),
      name: formData.get("name").trim(),
      companyCode: formData.get("companyCode").trim(),
      vatCode: formData.get("vatCode").trim(),
      address: formData.get("address").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim(),
      contactPerson: formData.get("contactPerson").trim(),
      notes: formData.get("notes").trim(),
      isActive: Boolean(formData.get("isActive")),
    };
    const mode = state.modal.mode;
    if (!customer.name) {
      setToast("Įveskite kliento pavadinimą arba vardą ir pavardę.");
      return;
    }
    await runSaving(async () => {
      await database.saveCustomer(customer);
      state.modal = null;
      await reloadAllData();
      setToast(mode === "add" ? "Klientas pridėtas." : "Klientas atnaujintas.");
    });
    return;
  }

  if (form.dataset.form === "payment") {
    const payment = {
      documentId: formData.get("documentId"),
      paymentDate: formData.get("paymentDate"),
      amount: Number(formData.get("amount")),
      method: formData.get("method"),
      notes: formData.get("notes").trim(),
    };
    const document = findSalesDocument(payment.documentId);
    if (!document) return;
    if (!payment.paymentDate) {
      setToast("Pasirinkite mokėjimo datą.");
      return;
    }
    if (Number.isNaN(payment.amount) || payment.amount <= 0) {
      setToast("Mokėjimo suma turi būti didesnė už 0.");
      return;
    }
    if (payment.amount > document.debt) {
      requestConfirmation({
        title: "Mokėjimas viršija skolą",
        message: `Mokėjimo suma viršija likusią skolą (${formatMoney(document.debt)}). Suma nebus išsaugota, kol jos nepataisysite.`,
        confirmAction: "close-modal",
        confirmLabel: "Supratau",
        danger: true,
      });
      return;
    }
    await runSaving(async () => {
      await database.registerPayment(payment);
      state.modal = null;
      await reloadAllData();
      state.selectedSalesDocumentId = payment.documentId;
      state.page = "sales-document-detail";
      setToast("Mokėjimas užregistruotas.");
    });
    return;
  }

  state.modal = null;
  render();
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function idsEqual(left, right) {
  return String(left) === String(right);
}

function upsert(items, item) {
  const index = items.findIndex((current) => idsEqual(current.id, item.id));
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }
}

function updateDocumentRow(input) {
  const rowId = input.closest("tr").dataset.rowId;
  const field = input.dataset.rowField;
  const row = state.newDoc.rows.find((item) => item.rowId === rowId);
  if (!row) return;

  if (field === "quantity" || field === "unitPrice") {
    row[field] = Number(input.value);
  } else {
    row[field] = input.value;
  }

  if (field === "article") updateProductLookup(row, input);
  refreshDocumentRow(rowId);
  refreshDocumentTotals();
}

function updateSalesDocumentField(input) {
  const field = input.dataset.salesDocField;
  const previousType = state.salesDraft.type;
  const previousDate = state.salesDraft.date;
  state.salesDraft[field] = input.type === "checkbox" ? input.checked : input.value;
  let shouldRender = false;
  if (field === "type") {
    state.salesTab = input.value;
    state.salesDraft.reserveStock = input.value === "ORDER" && state.salesAdvancedReady;
    shouldRender = true;
  }
  if ((field === "type" && previousType !== input.value) || (field === "date" && previousDate.slice(0, 7) !== input.value.slice(0, 7))) {
    state.salesDraft.number = nextSalesDocumentNumber(state.salesDraft.type, state.salesDraft.date);
    const numberInput = document.querySelector('[data-sales-doc-field="number"]');
    if (numberInput) numberInput.value = state.salesDraft.number;
  }
  if (field === "reserveStock") shouldRender = true;
  if (shouldRender) render();
}

function updateSalesDocumentRow(input) {
  const rowId = input.closest("tr").dataset.salesRowId;
  const field = input.dataset.salesRowField;
  const row = state.salesDraft.rows.find((item) => item.rowId === rowId);
  if (!row) return;

  if (["quantity", "unitPrice", "discountPercent", "vatRate"].includes(field)) {
    row[field] = Number(input.value);
  } else {
    row[field] = input.value;
  }

  if (field === "article") updateSalesProductLookup(row, input);
  refreshSalesDocumentRow(rowId);
  refreshSalesDocumentTotals();
}

function updateProductLookup(row, input) {
  const query = input.value.trim().toLowerCase();
  row.lookupMatches = [];
  row.lookupMessage = "";
  row.productId = null;
  const selectableProducts = activeProducts();

  if (!query) {
    refreshLookupPanel(row);
    return;
  }

  const exact = selectableProducts.find((product) => product.article.toLowerCase() === query);
  if (exact) {
    applyProductToRow(row, exact);
    const currentRow = input.closest("tr");
    currentRow.querySelector('[data-row-field="article"]').value = exact.article;
    currentRow.querySelector('[data-row-field="name"]').value = exact.name;
    currentRow.querySelector('[data-row-field="unit"]').value = exact.unit;
    currentRow.querySelector('[data-row-field="unitPrice"]').value = exact.cost;
    refreshLookupPanel(row);
    return;
  }

  const matches = selectableProducts
    .filter(
      (product) =>
        product.article.toLowerCase().includes(query) || product.name.toLowerCase().includes(query),
    )
    .slice(0, 5);

  if (matches.length) {
    row.lookupMatches = matches;
  } else {
    row.lookupMessage = "Prekė nerasta kataloge.";
  }
  refreshLookupPanel(row);
}

function updateSalesProductLookup(row, input) {
  const query = input.value.trim().toLowerCase();
  row.lookupMatches = [];
  row.lookupMessage = "";
  row.productId = null;
  const selectableProducts = activeProducts();

  if (!query) {
    refreshSalesLookupPanel(row);
    return;
  }

  const exact = selectableProducts.find((product) => product.article.toLowerCase() === query);
  if (exact) {
    applyProductToSalesRow(row, exact);
    const currentRow = input.closest("tr");
    currentRow.querySelector('[data-sales-row-field="article"]').value = exact.article;
    currentRow.querySelector('[data-sales-row-field="name"]').value = exact.name;
    currentRow.querySelector('[data-sales-row-field="unit"]').value = exact.unit;
    currentRow.querySelector('[data-sales-row-field="unitPrice"]').value = exact.price;
    refreshSalesLookupPanel(row);
    refreshSalesDocumentRow(row.rowId);
    refreshSalesDocumentTotals();
    return;
  }

  const matches = selectableProducts
    .filter(
      (product) =>
        product.article.toLowerCase().includes(query) || product.name.toLowerCase().includes(query),
    )
    .slice(0, 5);

  row.lookupMatches = matches;
  row.lookupMessage = matches.length ? "" : "Prekė nerasta kataloge.";
  refreshSalesLookupPanel(row);
}

function applyProductToRow(row, product) {
  row.productId = product.id;
  row.article = product.article;
  row.name = product.name;
  row.unit = product.unit;
  row.unitPrice = product.cost;
  row.lookupMatches = [];
  row.lookupMessage = "";
}

function applyProductToSalesRow(row, product) {
  row.productId = product.id;
  row.article = product.article;
  row.name = product.name;
  row.unit = product.unit;
  row.currentStock = Number(product.stock) || 0;
  row.reservedStock = reservedQuantityForProduct(product.id, state.salesDraft.editingId);
  row.unitPrice = Number(product.price) || 0;
  row.vatRate = Number(product.vat) || 21;
  row.lookupMatches = [];
  row.lookupMessage = "";
}

function selectProductForRow(rowId, productId) {
  const row = state.newDoc.rows.find((item) => item.rowId === rowId);
  const product = activeProducts().find((item) => idsEqual(item.id, productId));
  if (!row || !product) return;
  applyProductToRow(row, product);
  const rowElement = document.querySelector(`[data-row-id="${rowId}"]`);
  rowElement.querySelector('[data-row-field="article"]').value = product.article;
  rowElement.querySelector('[data-row-field="name"]').value = product.name;
  rowElement.querySelector('[data-row-field="unit"]').value = product.unit;
  rowElement.querySelector('[data-row-field="unitPrice"]').value = product.cost;
  refreshLookupPanel(row);
  refreshDocumentRow(rowId);
  refreshDocumentTotals();
}

function selectSalesProductForRow(rowId, productId) {
  const row = state.salesDraft.rows.find((item) => item.rowId === rowId);
  const product = activeProducts().find((item) => idsEqual(item.id, productId));
  if (!row || !product) return;
  applyProductToSalesRow(row, product);
  const rowElement = document.querySelector(`[data-sales-row-id="${rowId}"]`);
  rowElement.querySelector('[data-sales-row-field="article"]').value = product.article;
  rowElement.querySelector('[data-sales-row-field="name"]').value = product.name;
  rowElement.querySelector('[data-sales-row-field="unit"]').value = product.unit;
  rowElement.querySelector('[data-sales-row-field="unitPrice"]').value = product.price;
  rowElement.querySelector('[data-sales-row-field="vatRate"]').value = product.vat;
  refreshSalesLookupPanel(row);
  refreshSalesDocumentRow(rowId);
  refreshSalesDocumentTotals();
}

function applyPendingProductToRow(product) {
  if (!state.pendingProductRowId) return;
  const row = state.newDoc.rows.find((item) => item.rowId === state.pendingProductRowId);
  if (row) applyProductToRow(row, product);
  state.pendingProductRowId = null;
}

function refreshLookupPanel(row) {
  const panel = document
    .querySelector(`[data-row-id="${row.rowId}"]`)
    ?.querySelector("[data-lookup-panel]");
  if (!panel) return;
  panel.innerHTML = renderProductLookup(row);
  bindActionButtons(panel);
}

function refreshSalesLookupPanel(row) {
  const panel = document
    .querySelector(`[data-sales-row-id="${row.rowId}"]`)
    ?.querySelector("[data-sales-lookup-panel]");
  if (!panel) return;
  panel.innerHTML = renderSalesProductLookup(row);
  bindActionButtons(panel);
}

function refreshProductsTable() {
  const products = filteredProducts();
  const visiblePool = productsForCurrentStatus();
  const body = document.querySelector("[data-products-body]");
  const count = document.querySelector("[data-products-count]");
  if (body) body.innerHTML = renderProductsRows(products);
  if (count) count.textContent = `${products.length} iš ${visiblePool.length}`;
  document.querySelectorAll("[data-products-body] button[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });
}

function refreshDocumentRow(rowId) {
  const row = state.newDoc.rows.find((item) => item.rowId === rowId);
  const rowElement = document.querySelector(`[data-row-id="${rowId}"]`);
  const sumElement = rowElement?.querySelector("[data-row-sum]");
  if (!row || !sumElement) return;
  sumElement.innerHTML = `<strong>${formatMoney(lineSubtotal(row))}</strong>`;
}

function refreshDocumentTotals() {
  const totals = documentTotals(state.newDoc.rows);
  const subtotal = document.querySelector('[data-total="subtotal"]');
  const vat = document.querySelector('[data-total="vat"]');
  const total = document.querySelector('[data-total="total"]');
  if (subtotal) subtotal.textContent = formatMoney(totals.subtotal);
  if (vat) vat.textContent = formatMoney(totals.vat);
  if (total) total.textContent = formatMoney(totals.total);
}

function refreshSalesDocumentRow(rowId) {
  const row = state.salesDraft.rows.find((item) => item.rowId === rowId);
  const rowElement = document.querySelector(`[data-sales-row-id="${rowId}"]`);
  if (!row || !rowElement) return;
  const totals = salesLineTotals(row);
  rowElement.querySelector("[data-sales-row-stock]").textContent = formatNumber(row.currentStock);
  rowElement.querySelector("[data-sales-row-reserved]").textContent = formatNumber(row.reservedStock);
  rowElement.querySelector("[data-sales-row-subtotal]").textContent = formatMoney(totals.subtotal);
  rowElement.querySelector("[data-sales-row-vat]").textContent = formatMoney(totals.vat);
  rowElement.querySelector("[data-sales-row-total]").innerHTML = `<strong>${formatMoney(totals.total)}</strong>`;
}

function refreshSalesDocumentTotals() {
  const totals = salesDocumentTotals(state.salesDraft.rows, []);
  const subtotal = document.querySelector('[data-sales-total="subtotal"]');
  const discount = document.querySelector('[data-sales-total="discount"]');
  const vat = document.querySelector('[data-sales-total="vat"]');
  const total = document.querySelector('[data-sales-total="total"]');
  const debt = document.querySelector('[data-sales-total="debt"]');
  if (subtotal) subtotal.textContent = formatMoney(totals.subtotal);
  if (discount) discount.textContent = formatMoney(totals.discountTotal);
  if (vat) vat.textContent = formatMoney(totals.vat);
  if (total) total.textContent = formatMoney(totals.total);
  if (debt) debt.textContent = formatMoney(totals.debt);
}

function validateCurrentDocument() {
  const doc = state.newDoc;
  if (!doc.supplierId) {
    setToast("Pasirinkite tiekėją.");
    return false;
  }
  if (!doc.rows.length) {
    setToast("Pridėkite bent vieną prekių eilutę.");
    return false;
  }

  for (const [index, row] of doc.rows.entries()) {
    const number = index + 1;
    if (!row.article.trim()) {
      setToast(`${number} eilutėje neįvestas artikulas.`);
      return false;
    }
    if (!row.name.trim()) {
      setToast(`${number} eilutėje neįvestas prekės pavadinimas.`);
      return false;
    }
    if ((Number(row.quantity) || 0) <= 0) {
      setToast(`${number} eilutėje kiekis turi būti didesnis už 0.`);
      return false;
    }
    if (Number(row.unitPrice) < 0 || Number.isNaN(Number(row.unitPrice))) {
      setToast(`${number} eilutėje vieneto kaina negali būti neigiama.`);
      return false;
    }
    if (database.isConfigured && !row.productId) {
      setToast(`${number} eilutėje pasirinkite prekę iš katalogo arba ją sukurkite.`);
      return false;
    }
  }
  return true;
}

function validateCurrentSalesDocument() {
  const doc = state.salesDraft;
  if (!doc.customerId) {
    setToast("Pasirinkite klientą.");
    return false;
  }
  if (!doc.rows.length) {
    setToast("Pridėkite bent vieną prekių eilutę.");
    return false;
  }
  if (doc.type === "ORDER" && doc.reserveStock && !state.salesAdvancedReady) {
    setToast("Rezervacijoms reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return false;
  }
  for (const [index, row] of doc.rows.entries()) {
    const number = index + 1;
    if (!row.productId) {
      setToast(`${number} eilutėje pasirinkite prekę iš katalogo.`);
      return false;
    }
    if ((Number(row.quantity) || 0) <= 0) {
      setToast(`${number} eilutėje kiekis turi būti didesnis už 0.`);
      return false;
    }
    if (Number(row.unitPrice) < 0 || Number.isNaN(Number(row.unitPrice))) {
      setToast(`${number} eilutėje kaina negali būti neigiama.`);
      return false;
    }
    if (Number(row.discountPercent) < 0 || Number(row.discountPercent) > 100) {
      setToast(`${number} eilutėje nuolaida turi būti nuo 0 iki 100 procentų.`);
      return false;
    }
    if (["ORDER", "DELIVERY_NOTE"].includes(doc.type)) {
      const product = state.products.find((item) => idsEqual(item.id, row.productId));
      const excludedReservationDocumentId = doc.type === "DELIVERY_NOTE" && doc.sourceDocumentId
        ? doc.sourceDocumentId
        : doc.editingId;
      const freeStock = freeStockForProduct(product, excludedReservationDocumentId);
      if ((Number(row.quantity) || 0) > freeStock) {
        setToast(`${number} eilutėje nepakanka laisvo likučio. Laisva: ${formatNumber(freeStock)} ${row.unit}.`);
        return false;
      }
    }
  }
  return true;
}

async function saveDocumentDraft() {
  if (!validateCurrentDocument()) return;
  const document = documentFromCurrentForm(STATUS_DRAFT);
  await runSaving(async () => {
    await database.saveDraft(document);
    state.newDoc = blankDocument();
    state.page = "documents";
    await reloadAllData();
    setToast("Juodraštis sėkmingai išsaugotas.");
  });
}

async function saveAndConfirmDocument() {
  if (!validateCurrentDocument()) return;
  const document = documentFromCurrentForm(STATUS_DRAFT);
  await runSaving(async () => {
    const documentId = await database.saveDraft(document);
    await database.confirmDocument(documentId);
    state.newDoc = blankDocument();
    state.page = "documents";
    await reloadAllData();
    setToast("Dokumentas patvirtintas. Sandėlio likučiai atnaujinti.");
  });
}

async function saveSalesDraft() {
  if (!validateCurrentSalesDocument()) return;
  const document = salesDocumentFromCurrentForm();
  await runSaving(async () => {
    await database.saveSalesDraft(document);
    state.salesTab = document.type;
    state.salesDraft = blankSalesDocument(document.type);
    state.page = "sales";
    await reloadAllData();
    setToast(document.type === "ORDER" && document.reserveStock ? "Juodraštis išsaugotas, prekės rezervuotos." : "Pardavimo juodraštis išsaugotas.");
  });
}

async function saveAndConfirmDeliveryNote() {
  if (!validateCurrentSalesDocument()) return;
  if (state.salesDraft.type !== "DELIVERY_NOTE") {
    setToast("Patvirtinti galima tik važtaraštį.");
    return;
  }
  const document = salesDocumentFromCurrentForm();
  await runSaving(async () => {
    const documentId = await database.saveSalesDraft(document);
    await database.confirmDeliveryNote(documentId);
    state.salesTab = "DELIVERY_NOTE";
    state.salesDraft = blankSalesDocument("DELIVERY_NOTE");
    state.page = "sales";
    await reloadAllData();
    setToast("Važtaraštis patvirtintas. Sandėlio likutis sumažintas.");
  });
}

function prepareLowStockReceiptDraft() {
  const lowStock = activeProducts().filter(isLowStockProduct);
  if (!lowStock.length) {
    setToast("Mažo likučio prekių nėra.");
    return;
  }

  const draft = blankDocument();
  draft.notes = "Automatiškai paruošta pagal mažus likučius.";
  if (state.suppliers.length === 1) {
    draft.supplierId = String(state.suppliers[0].id);
  }
  draft.rows = lowStock.map((product) => ({
    rowId: crypto.randomUUID(),
    lineId: null,
    productId: product.id,
    article: product.article,
    name: product.name,
    unit: product.unit || "vnt.",
    quantity: reorderQuantityForProduct(product),
    unitPrice: Number(product.cost) || 0,
    vat: Number(product.vat) || 21,
    lookupMessage: "",
    lookupMatches: [],
  }));
  state.newDoc = draft;
  state.page = "new-document";
  setToast(state.suppliers.length === 1
    ? `Paruošta ${lowStock.length} prekių papildymo juodraštyje.`
    : `Paruošta ${lowStock.length} prekių. Pasirinkite tiekėją.`);
}

function reorderQuantityForProduct(product) {
  const minimum = Math.max(5, Number(product.minimumStock) || 0);
  const target = Math.max(10, minimum * 2);
  return Math.max(1, Math.ceil(target - freeStockForProduct(product)));
}

function openDebtReminderModal(customerId) {
  const row = customerDebtSummaries().find((item) => idsEqual(item.customer.id, customerId));
  if (!row) {
    setToast("Šiam klientui neapmokėtų skolų nėra.");
    return;
  }
  state.modal = {
    type: "debt-reminder",
    data: {
      customerId,
      text: debtReminderText(row),
    },
  };
  render();
}

function debtReminderText(row) {
  const documents = row.documents
    .map((document) => `- ${document.number}, data ${document.date}, mokėjimo terminas ${document.dueDate || "-"}, likutis ${formatMoney(document.debt)}`)
    .join("\n");
  const greeting = row.customer.contactPerson ? `Sveiki, ${row.customer.contactPerson},` : "Sveiki,";
  return `${greeting}

Primename, kad pagal žemiau nurodytus dokumentus yra likusi neapmokėta suma: ${formatMoney(row.debt)}.

${documents}

Prašome patikrinti informaciją ir, jeigu mokėjimas jau atliktas, atsiųsti mokėjimo patvirtinimą.

Ačiū.`;
}

async function copyDebtReminder() {
  const text = state.modal?.data?.text ?? "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setToast("Priminimo tekstas nukopijuotas.");
  } catch {
    setToast("Nepavyko automatiškai nukopijuoti. Pažymėkite tekstą rankiniu būdu.");
  }
}

function documentFromCurrentForm(status) {
  const existing = findDocument(state.newDoc.editingId);
  const totals = documentTotals(state.newDoc.rows);
  const timestamp = nowIso();
  return {
    id: state.newDoc.editingId ?? null,
    number: state.newDoc.number,
    supplierId: state.newDoc.supplierId,
    supplierDocumentNumber: state.newDoc.supplierDocumentNumber.trim(),
    date: state.newDoc.date,
    notes: state.newDoc.notes.trim(),
    status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    confirmedAt: existing?.confirmedAt ?? "",
    cancelledAt: existing?.cancelledAt ?? "",
    lines: state.newDoc.rows.map((row) => ({
      lineId: row.lineId ?? crypto.randomUUID(),
      productId: row.productId,
      article: row.article.trim(),
      name: row.name.trim(),
      unit: row.unit || "vnt.",
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      vat: Number(row.vat) || 21,
    })),
    ...totals,
  };
}

function salesDocumentFromCurrentForm() {
  const existing = findSalesDocument(state.salesDraft.editingId);
  return {
    id: state.salesDraft.editingId ?? null,
    sourceDocumentId: state.salesDraft.sourceDocumentId,
    type: state.salesDraft.type,
    number: state.salesDraft.number,
    customerId: state.salesDraft.customerId,
    customerDocumentNumber: state.salesDraft.customerDocumentNumber.trim(),
    date: state.salesDraft.date,
    dueDate: state.salesDraft.dueDate,
    currency: state.salesDraft.currency,
    responsibleEmployee: state.salesDraft.responsibleEmployee.trim(),
    notes: state.salesDraft.notes.trim(),
    reserveStock: Boolean(state.salesDraft.reserveStock),
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    lines: state.salesDraft.rows.map((row) => ({
      lineId: row.lineId ?? crypto.randomUUID(),
      productId: row.productId,
      article: row.article.trim(),
      name: row.name.trim(),
      unit: row.unit || "vnt.",
      currentStock: Number(row.currentStock) || 0,
      reservedStock: Number(row.reservedStock) || 0,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      discountPercent: Number(row.discountPercent) || 0,
      vatRate: Number(row.vatRate) || 21,
    })),
  };
}

async function confirmExistingDocument(id) {
  const document = findDocument(id);
  if (!document) return;
  if (document.status !== STATUS_DRAFT) {
    setToast("Dokumentas jau patvirtintas arba atšauktas.");
    return;
  }
  await runSaving(async () => {
    await database.confirmDocument(id);
    await reloadAllData();
    setToast("Dokumentas patvirtintas. Sandėlio likučiai atnaujinti.");
  });
}

async function cancelDocument(id) {
  const document = findDocument(id);
  if (!document) return;
  if (document.status !== STATUS_CONFIRMED) {
    setToast("Atšaukti galima tik patvirtintą dokumentą.");
    return;
  }
  await runSaving(async () => {
    await database.cancelDocument(id);
    await reloadAllData();
    setToast("Dokumentas atšauktas.");
  });
}

async function deleteDraftDocument(id) {
  const document = findDocument(id);
  if (!document) return;
  if (document.status !== STATUS_DRAFT) {
    setToast("Ištrinti galima tik juodraštį.");
    return;
  }
  await runSaving(async () => {
    await database.deleteDraftDocument(id);
    state.page = "documents";
    state.selectedDocumentId = null;
    await reloadAllData();
    setToast("Juodraštis ištrintas.");
  });
}

async function confirmDeliveryNote(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (document.type !== "DELIVERY_NOTE") {
    setToast("Patvirtinti galima tik važtaraštį.");
    return;
  }
  if (document.status !== "DRAFT") {
    setToast("Važtaraštis jau patvirtintas arba atšauktas.");
    return;
  }
  await runSaving(async () => {
    await database.confirmDeliveryNote(id);
    await reloadAllData();
    state.selectedSalesDocumentId = id;
    state.page = "sales-document-detail";
    setToast("Važtaraštis patvirtintas. Likutis sumažintas vieną kartą.");
  });
}

async function cancelDeliveryNote(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (document.type !== "DELIVERY_NOTE" || document.status !== "CONFIRMED") {
    setToast("Atšaukti galima tik patvirtintą važtaraštį.");
    return;
  }
  await runSaving(async () => {
    await database.cancelDeliveryNote(id);
    await reloadAllData();
    state.selectedSalesDocumentId = id;
    state.page = "sales-document-detail";
    setToast("Važtaraštis atšauktas, prekės grąžintos į sandėlį.");
  });
}

async function reserveSalesDocument(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (!state.salesAdvancedReady) {
    setToast("Rezervacijoms reikia įkelti papildomą pardavimų SQL funkcijų dalį.");
    return;
  }
  if (document.type !== "ORDER") {
    setToast("Rezervuoti galima tik užsakymo dokumente.");
    return;
  }
  await runSaving(async () => {
    await database.reserveSalesDocument(id);
    await reloadAllData();
    state.selectedSalesDocumentId = id;
    state.page = "sales-document-detail";
    setToast("Prekės rezervuotos.");
  });
}

async function cancelSalesDocument(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (document.type === "DELIVERY_NOTE" && document.status === "CONFIRMED") {
    await cancelDeliveryNote(id);
    return;
  }
  await runSaving(async () => {
    if (document.type === "ORDER") await database.cancelSalesReservation(id);
    await database.cancelSalesDocument(id);
    await reloadAllData();
    state.selectedSalesDocumentId = id;
    state.page = "sales-document-detail";
    setToast("Pardavimo dokumentas atšauktas.");
  });
}

async function deleteSalesDraft(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (document.status !== "DRAFT") {
    setToast("Ištrinti galima tik juodraštį.");
    return;
  }
  await runSaving(async () => {
    await database.deleteSalesDraft(id);
    state.page = "sales";
    state.selectedSalesDocumentId = null;
    await reloadAllData();
    setToast("Pardavimo juodraštis ištrintas.");
  });
}

function loadSalesDocumentForEdit(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  if (document.status !== "DRAFT") {
    setToast("Redaguoti galima tik pardavimo juodraštį.");
    return;
  }
  state.salesDraft = salesDraftFromDocument(document);
  state.salesTab = document.type;
  state.page = "new-sales-document";
  state.selectedSalesDocumentId = null;
  render();
}

function copySalesDocument(id) {
  const document = findSalesDocument(id);
  if (!document) return;
  state.salesDraft = {
    ...salesDraftFromDocument(document),
    editingId: null,
    sourceDocumentId: "",
    number: nextSalesDocumentNumber(document.type, todayDate()),
    date: todayDate(),
    dueDate: addDays(todayDate(), 14),
  };
  state.salesTab = document.type;
  state.page = "new-sales-document";
  render();
}

function convertSalesDocument(sourceId, targetType) {
  const source = findSalesDocument(sourceId);
  if (!source || !targetType) return;
  state.salesDraft = {
    ...salesDraftFromDocument(source),
    editingId: null,
    sourceDocumentId: source.id,
    type: targetType,
    number: nextSalesDocumentNumber(targetType, todayDate()),
    date: todayDate(),
    dueDate: addDays(todayDate(), 14),
    reserveStock: targetType === "ORDER",
  };
  state.salesDraft.rows = source.lines.map((line) => salesDraftRowFromLine(line));
  state.salesTab = targetType;
  state.page = "new-sales-document";
  render();
}

function salesDraftRowFromLine(line) {
  const product = state.products.find((item) => idsEqual(item.id, line.productId));
  return {
    ...line,
    rowId: crypto.randomUUID(),
    currentStock: Number(product?.stock) || 0,
    reservedStock: reservedQuantityForProduct(line.productId),
    lookupMessage: "",
    lookupMatches: [],
  };
}

function salesDraftFromDocument(document) {
  return {
    editingId: document.id,
    sourceDocumentId: document.sourceDocumentId ?? "",
    type: document.type,
    number: document.number,
    customerId: String(document.customerId),
    customerDocumentNumber: document.customerDocumentNumber,
    date: document.date,
    dueDate: document.dueDate,
    currency: document.currency,
    responsibleEmployee: document.responsibleEmployee,
    notes: document.notes,
    reserveStock: false,
    rows: document.lines.map((line) => salesDraftRowFromLine(line)),
  };
}

async function deleteProduct(id) {
  const product = findProduct(id);
  if (!product) return;
  const blockedMessage = productDeleteBlockMessage(product);
  if (blockedMessage) {
    setToast(blockedMessage);
    return;
  }
  await runSaving(async () => {
    await database.deleteProduct(id);
    state.page = "products";
    state.selectedProductId = null;
    await reloadAllData();
    setToast("Prekė pašalinta iš aktyvaus sąrašo.");
  });
}

async function restoreProduct(id) {
  const product = findProduct(id);
  if (!product) return;
  await runSaving(async () => {
    await database.restoreProduct(id);
    state.page = "products";
    state.selectedProductId = null;
    state.productStatusFilter = "active";
    await reloadAllData();
    setToast("Prekė grąžinta į aktyvų sąrašą.");
  });
}

function loadDocumentForEdit(id) {
  const document = findDocument(id);
  if (!document) return;
  if (document.status !== STATUS_DRAFT) {
    setToast("Patvirtinto arba atšaukto dokumento redaguoti negalima.");
    return;
  }
  state.newDoc = {
    editingId: document.id,
    supplierId: String(document.supplierId),
    number: document.number,
    supplierDocumentNumber: document.supplierDocumentNumber,
    date: document.date,
    notes: document.notes,
    rows: document.lines.map((line) => ({
      ...line,
      rowId: crypto.randomUUID(),
      lookupMessage: "",
      lookupMatches: [],
    })),
  };
  state.page = "new-document";
  state.selectedDocumentId = null;
  render();
}

function replaceDocument(document) {
  const index = state.documents.findIndex((item) => idsEqual(item.id, document.id));
  if (index >= 0) {
    state.documents[index] = { ...document, ...documentTotals(document.lines) };
  }
  if (state.page === "document-detail") {
    state.selectedDocumentId = document.id;
  }
  render();
}

function findDocument(id) {
  return state.documents.find((document) => idsEqual(document.id, id));
}

function findSalesDocument(id) {
  return state.salesDocuments.find((document) => idsEqual(document.id, id));
}

function findProduct(id) {
  return state.products.find((product) => idsEqual(product.id, id));
}

void initApp();
