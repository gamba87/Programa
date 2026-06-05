import { supabase } from "./supabase-client.js";

const FULL_IMPORT_BATCH_SIZE = 200;
const FULL_IMPORT_PAGE_SIZE = 1000;

function fullImportText(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function fullImportPageTitle() {
  return fullImportText(document.querySelector(".page-header h1"));
}

function fullImportNormalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fullImportArticle(value) {
  return String(value ?? "").trim().toUpperCase();
}

function fullImportClean(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function fullImportFlattenQuotedRows(value) {
  let fixed = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];
    if (char === '"' && quoted && next === '"') {
      fixed += '""';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      fixed += char;
      continue;
    }
    if ((char === "\n" || char === "\r") && quoted) {
      fixed += " ";
      if (char === "\r" && next === "\n") index += 1;
      continue;
    }
    fixed += char;
  }

  return fixed;
}

function fullImportParseLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(fullImportClean(current));
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(fullImportClean(current));
  return cells;
}

function fullImportDelimiter(lines) {
  return [";", "\t", ",", "|"]
    .map((delimiter) => ({
      delimiter,
      columns: Math.max(...lines.slice(0, 40).map((line) => fullImportParseLine(line, delimiter).length)),
    }))
    .sort((left, right) => right.columns - left.columns)[0].delimiter;
}

function fullImportOptionBaseLabel(option) {
  return fullImportText(option)
    .replace(/^\d+\.\s*/, "")
    .replace(/\s+\([^)]*\)/g, "")
    .replace(/\s+-\s+pvz\..*$/i, "")
    .trim();
}

function fullImportSelect(field) {
  return document.querySelector(`[data-price-import-column="${field}"]`);
}

function fullImportSelectedIndex(field) {
  const value = Number(fullImportSelect(field)?.value);
  return Number.isFinite(value) ? value : -1;
}

function fullImportOptionChecked(name) {
  const input = document.querySelector(`[data-price-import-option="${name}"]`);
  return Boolean(input?.checked && !input.disabled);
}

function fullImportLooksWithoutVat(option) {
  const text = fullImportNormalize(fullImportOptionBaseLabel(option));
  return text.includes("be pvm") || text.includes("without vat") || text.includes("excl vat") || text.includes("net retail");
}

function fullImportLooksWithVat(option) {
  const text = fullImportNormalize(fullImportOptionBaseLabel(option));
  return text.includes("su pvm") || text.includes("with vat") || text.includes("gross");
}

function fullImportLooksRetail(option) {
  const text = fullImportNormalize(fullImportOptionBaseLabel(option));
  return text.includes("mazmen") || text.includes("retail") || text.includes("rrp") || text.includes("list price");
}

function fullImportReadMapping() {
  const priceSelect = fullImportSelect("price");
  const priceOption = priceSelect?.selectedOptions?.[0];
  const saferPrice = Array.from(priceSelect?.options || []).find(fullImportLooksWithoutVat);
  const costSelect = fullImportSelect("cost");
  const costOption = costSelect?.selectedOptions?.[0];

  const columns = {
    article: fullImportSelectedIndex("article"),
    name: fullImportSelectedIndex("name"),
    manufacturer: fullImportSelectedIndex("manufacturer"),
    category: fullImportSelectedIndex("category"),
    cost: fullImportSelectedIndex("cost"),
    price: fullImportSelectedIndex("price"),
    vat: fullImportSelectedIndex("vat"),
    unit: fullImportSelectedIndex("unit"),
  };

  if (saferPrice && priceOption && !fullImportLooksWithoutVat(priceOption) && (fullImportLooksWithVat(priceOption) || fullImportLooksRetail(priceOption))) {
    columns.price = Number(saferPrice.value);
  }
  if (costOption && fullImportLooksRetail(costOption)) {
    columns.cost = -1;
  }

  const options = {
    updateCost: fullImportOptionChecked("updateCost") && columns.cost >= 0,
    updatePrice: fullImportOptionChecked("updatePrice") && columns.price >= 0,
    updateVat: fullImportOptionChecked("updateVat") && columns.vat >= 0,
    updateName: fullImportOptionChecked("updateName") && columns.name >= 0,
    updateManufacturer: fullImportOptionChecked("updateManufacturer") && columns.manufacturer >= 0,
    createMissing: fullImportOptionChecked("createMissing"),
  };

  if (columns.cost < 0) options.updateCost = false;
  return { columns, options };
}

function fullImportHeaderLabels() {
  const select = document.querySelector("[data-price-import-column]");
  return Array.from(select?.options || [])
    .filter((option) => option.value !== "-1")
    .map((option) => fullImportOptionBaseLabel(option));
}

function fullImportHeaderIndex(parsedRows, columns) {
  const labels = fullImportHeaderLabels();
  const selectedIndexes = Object.values(columns).filter((index) => Number(index) >= 0);
  let best = { index: -1, score: 0 };

  parsedRows.slice(0, 60).forEach((cells, rowIndex) => {
    let score = 0;
    selectedIndexes.forEach((columnIndex) => {
      const label = fullImportNormalize(labels[columnIndex] || "");
      const cell = fullImportNormalize(cells[columnIndex] || "");
      if (label && cell && (cell.includes(label) || label.includes(cell))) score += 2;
    });
    const rowText = fullImportNormalize(cells.join(" "));
    if (rowText.includes("code") || rowText.includes("artikulas") || rowText.includes("prekes kodas")) score += 2;
    if (rowText.includes("description") || rowText.includes("pavadinimas")) score += 2;
    if (rowText.includes("price") || rowText.includes("kaina")) score += 2;
    if (score > best.score) best = { index: rowIndex, score };
  });

  return best.score >= 4 ? best.index : 0;
}

function fullImportCell(cells, index) {
  return index >= 0 ? fullImportClean(cells[index]) : "";
}

function fullImportMoney(value) {
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

function fullImportSafeDecimal(value, fallback = 0, max = 1000000) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0 || number > max) return fallback;
  return Number(number.toFixed(4));
}

function fullImportRows(text, columns, existingByArticle) {
  const normalizedText = fullImportFlattenQuotedRows(text).replace(/^\uFEFF/, "").trim();
  const lines = normalizedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], sourceRows: 0 };

  const delimiter = fullImportDelimiter(lines);
  const parsed = lines.map((line) => fullImportParseLine(line, delimiter));
  const headerIndex = fullImportHeaderIndex(parsed, columns);
  const dataRows = parsed.slice(headerIndex + 1);
  const rows = dataRows.map((cells, offset) => {
    const article = fullImportCell(cells, columns.article);
    const cost = fullImportMoney(fullImportCell(cells, columns.cost));
    const price = fullImportMoney(fullImportCell(cells, columns.price));
    const vat = fullImportMoney(fullImportCell(cells, columns.vat));
    const existing = existingByArticle.get(fullImportArticle(article)) || null;
    return {
      lineNumber: headerIndex + offset + 2,
      article,
      name: fullImportCell(cells, columns.name),
      manufacturer: fullImportCell(cells, columns.manufacturer),
      category: fullImportCell(cells, columns.category),
      unit: fullImportCell(cells, columns.unit) || existing?.unit || "vnt.",
      cost,
      price,
      vat,
      existing,
    };
  });

  return { rows, sourceRows: dataRows.length };
}

function fullImportRowIssue(row, options) {
  if (!row.article) return "Nėra artikulo";
  if (/^\d{12,14}$/.test(String(row.article).trim())) return "Artikulas panašus į GTIN/EAN";
  if (/^\d{1,3}$/.test(String(row.article).trim()) && row.name && fullImportArticle(row.name) === fullImportArticle(row.article)) return "Eilutės numeris vietoje artikulo";
  if (row.price !== null && (row.price < 0 || row.price > 1000000)) return "Pardavimo kaina netinkama";
  if (row.cost !== null && (row.cost < 0 || row.cost > 1000000)) return "Savikaina netinkama";
  if (row.vat !== null && (row.vat < 0 || row.vat > 100)) return "PVM netinkamas";
  if (!row.existing && !options.createMissing) return "Prekė dar nėra sąraše";
  if (!row.existing && !row.name) return "Naujai prekei trūksta pavadinimo";
  if (!row.existing && row.price === null && row.cost === null) return "Naujai prekei trūksta kainos";
  return "";
}

function fullImportProductPayload(row, options) {
  const existing = row.existing;
  return {
    article_code: row.article,
    name: !existing || options.updateName ? (row.name || existing?.name || row.article) : existing.name,
    manufacturer: !existing || options.updateManufacturer ? (row.manufacturer || existing?.manufacturer || "") : existing.manufacturer,
    category: row.category || existing?.category || "",
    warehouse_location: existing?.warehouse_location || "Vilnius",
    current_stock: fullImportSafeDecimal(existing?.current_stock, 0),
    minimum_stock: fullImportSafeDecimal(existing?.minimum_stock, 0),
    unit: row.unit || existing?.unit || "vnt.",
    purchase_price: fullImportSafeDecimal(options.updateCost || !existing ? (row.cost ?? existing?.purchase_price) : existing?.purchase_price, 0),
    sale_price: fullImportSafeDecimal(options.updatePrice || !existing ? (row.price ?? existing?.sale_price) : existing?.sale_price, 0),
    vat_rate: fullImportSafeDecimal(options.updateVat || !existing ? (row.vat ?? existing?.vat_rate ?? 21) : existing?.vat_rate, 21, 100),
    notes: existing?.notes || "",
    is_active: existing?.is_active !== false,
  };
}

async function fullImportFetchAllProducts() {
  const products = [];
  for (let from = 0; ; from += FULL_IMPORT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("id,article_code,name,manufacturer,category,warehouse_location,current_stock,minimum_stock,unit,purchase_price,sale_price,vat_rate,notes,is_active")
      .range(from, from + FULL_IMPORT_PAGE_SIZE - 1);
    if (error) throw error;
    products.push(...(data || []));
    if (!data || data.length < FULL_IMPORT_PAGE_SIZE) break;
  }
  return products;
}

function fullImportChunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function fullImportUpsertProducts(tasks) {
  const result = { saved: 0, failed: 0, errors: [] };
  for (const chunk of fullImportChunk(tasks, FULL_IMPORT_BATCH_SIZE)) {
    const payloads = chunk.map((task) => task.payload);
    const { data, error } = await supabase.from("products").upsert(payloads, { onConflict: "article_code" }).select("article_code");
    if (!error) {
      result.saved += data?.length || payloads.length;
      continue;
    }

    for (const task of chunk) {
      const single = await supabase.from("products").upsert(task.payload, { onConflict: "article_code" }).select("article_code").single();
      if (single.error) {
        result.failed += 1;
        if (result.errors.length < 5) result.errors.push(`${task.payload.article_code}: ${single.error.message}`);
      } else {
        result.saved += 1;
      }
    }
  }
  return result;
}

function fullImportShowToast(message, tone = "info") {
  document.querySelector("[data-price-import-full-toast]")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${tone === "error" ? "error-toast" : ""}`;
  toast.dataset.priceImportFullToast = "true";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 9000);
}

function fullImportSetCreateMissingChecked() {
  const input = document.querySelector('[data-price-import-option="createMissing"]');
  if (!input || input.checked) return;
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function fullImportApply(button) {
  if (!supabase) {
    fullImportShowToast("Supabase neprijungtas.", "error");
    return;
  }

  const textarea = document.querySelector("[data-price-import-text]");
  const text = textarea?.value || "";
  const { columns, options } = fullImportReadMapping();
  if (!text.trim()) {
    fullImportShowToast("Pirmiausia įkelkite kainininko failą.", "error");
    return;
  }
  if (columns.article < 0) {
    fullImportShowToast("Pasirinkite, kuris stulpelis yra artikulas / prekės kodas.", "error");
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Importuojama...";

  try {
    const existingProducts = await fullImportFetchAllProducts();
    const existingByArticle = new Map(existingProducts.map((product) => [fullImportArticle(product.article_code), product]));
    const parsed = fullImportRows(text, columns, existingByArticle);
    const skipped = [];
    const byArticle = new Map();

    parsed.rows.forEach((row) => {
      const issue = fullImportRowIssue(row, options);
      if (issue) {
        skipped.push({ row, issue });
        return;
      }
      byArticle.set(fullImportArticle(row.article), row);
    });

    const missingWithoutCreate = skipped.filter((item) => item.issue === "Prekė dar nėra sąraše").length;
    if (missingWithoutCreate > 0 && !options.createMissing) {
      fullImportSetCreateMissingChecked();
      fullImportShowToast(`Radau ${missingWithoutCreate} naujų artikulų. Pažymėjau „Sukurti prekes, kurių dar nėra sąraše“ - spauskite „Atnaujinti prekes“ dar kartą.`, "error");
      return;
    }

    const tasks = Array.from(byArticle.values()).map((row) => ({
      row,
      action: row.existing ? "update" : "create",
      payload: fullImportProductPayload(row, options),
    }));

    if (!tasks.length) {
      fullImportShowToast(`Nėra ką importuoti. Nuskaityta ${parsed.sourceRows}, praleista ${skipped.length}.`, "error");
      return;
    }

    const saveResult = await fullImportUpsertProducts(tasks);
    const updated = tasks.filter((task) => task.action === "update").length;
    const created = tasks.filter((task) => task.action === "create").length;
    const duplicateCount = parsed.rows.length - byArticle.size - skipped.length;
    const failedText = saveResult.failed ? ` Nepavyko: ${saveResult.failed}.` : "";
    const skippedText = skipped.length || duplicateCount ? ` Praleista: ${skipped.length + Math.max(0, duplicateCount)}.` : "";
    fullImportShowToast(`Kainininkas įkeltas pilnai: atnaujinta ${updated}, sukurta ${created}.${skippedText}${failedText}`);
    window.setTimeout(() => window.location.reload(), 1400);
  } catch (error) {
    fullImportShowToast(error?.message || "Nepavyko įkelti viso kainininko.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target?.closest?.('[data-action="apply-price-import"]');
    if (!button || fullImportPageTitle() !== "Kainininkai") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void fullImportApply(button);
  },
  true,
);
