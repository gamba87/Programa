const PRODUCTIVITY_MARK = "smartProductivity";
const PRICE_MAPPING_KEY_PREFIX = "inventory.priceImport.mapping.";
const PRICE_MAPPING_FIELDS = ["article", "name", "manufacturer", "cost", "price", "vat"];

function addonText(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function addonPageTitle() {
  return addonText(document.querySelector(".page-header h1"));
}

function addonClickPage(page) {
  document.querySelector(`[data-page="${page}"]`)?.click();
}

function addonClickAction(action) {
  document.querySelector(`[data-action="${action}"]:not(:disabled)`)?.click();
}

function addonStableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash);
}

function flattenQuotedPriceImportRows(value) {
  let fixed = "";
  let quoted = false;
  let changed = false;

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
      changed = true;
      if (char === "\r" && next === "\n") index += 1;
      continue;
    }

    fixed += char;
  }

  return changed ? fixed : value;
}

function fixMultilinePriceImportHeader() {
  if (addonPageTitle() !== "Kainininkai") return;
  const textarea = document.querySelector("[data-price-import-text]");
  if (!textarea?.value) return;

  const fixed = flattenQuotedPriceImportRows(textarea.value);
  if (fixed === textarea.value) return;

  const hash = addonStableHash(textarea.value);
  if (textarea.dataset.smartMultilineFixed === hash) return;
  textarea.dataset.smartMultilineFixed = hash;
  textarea.value = fixed;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  window.requestAnimationFrame(() => addonClickAction("parse-price-import"));
}

function normalizeImportLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseSmartDelimitedLine(line, delimiter) {
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
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function detectSmartDelimiter(lines) {
  return [";", "\t", ",", "|"]
    .map((delimiter) => ({
      delimiter,
      columns: Math.max(...lines.slice(0, 20).map((line) => parseSmartDelimitedLine(line, delimiter).length)),
    }))
    .sort((left, right) => right.columns - left.columns)[0].delimiter;
}

function priceImportParsedTable() {
  const textarea = document.querySelector("[data-price-import-text]");
  const text = flattenQuotedPriceImportRows(textarea?.value || "").replace(/^\uFEFF/, "").trim();
  if (!text) return { headers: [], rows: [] };
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const delimiter = detectSmartDelimiter(lines);
  const parsed = lines.map((line) => parseSmartDelimitedLine(line, delimiter));
  const selectHeaders = Array.from(document.querySelector("[data-price-import-column]")?.options || [])
    .slice(1)
    .map((option) => addonText(option).replace(/^\d+\.\s*/, "").replace(/\s+-\s+pvz\..*$/, ""));
  const wanted = selectHeaders.slice(0, 4).map(normalizeImportLabel).filter(Boolean);
  let headerIndex = parsed.findIndex((cells) => {
    const normalized = cells.map(normalizeImportLabel);
    return wanted.length >= 2 && wanted.filter((header) => normalized.includes(header)).length >= 2;
  });
  if (headerIndex < 0) headerIndex = parsed.findIndex((cells) => cells.length >= Math.max(2, selectHeaders.length));
  return {
    headers: headerIndex >= 0 ? parsed[headerIndex] : [],
    rows: headerIndex >= 0 ? parsed.slice(headerIndex + 1).filter((cells) => cells.some(Boolean)) : [],
  };
}

function priceImportSampleFor(index) {
  if (index < 0) return "";
  const table = priceImportParsedTable();
  const row = table.rows.find((cells) => cells[index]);
  return row?.[index] || "";
}

function selectedOptionText(field) {
  const select = document.querySelector(`[data-price-import-column="${field}"]`);
  return addonText(select?.selectedOptions?.[0]);
}

function setPriceImportColumn(field, option) {
  const select = document.querySelector(`[data-price-import-column="${field}"]`);
  if (!select || !option || select.value === option.value) return false;
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setPriceImportOption(optionName, checked) {
  const input = document.querySelector(`[data-price-import-option="${optionName}"]`);
  if (!input || input.checked === checked) return false;
  input.checked = checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function optionLooksLikeWithoutVat(option) {
  const text = normalizeImportLabel(addonText(option));
  return text.includes("be pvm") || text.includes("without vat") || text.includes("excl vat") || text.includes("net retail");
}

function optionLooksLikeWithVat(option) {
  const text = normalizeImportLabel(addonText(option));
  return text.includes("su pvm") || text.includes("with vat") || text.includes("gross");
}

function optionLooksLikeRetail(option) {
  const text = normalizeImportLabel(addonText(option));
  return text.includes("mazmen") || text.includes("retail") || text.includes("rrp");
}

function enhancePriceImportRawText() {
  const textarea = document.querySelector("[data-price-import-text]");
  const field = textarea?.closest(".form-field");
  if (!textarea || !field || field.closest("[data-smart-raw-import]")) return;
  const details = document.createElement("details");
  details.dataset.smartRawImport = "true";
  details.open = !textarea.value.trim();
  details.style.border = "1px solid var(--line)";
  details.style.borderRadius = "8px";
  details.style.padding = "12px 14px";
  details.style.background = "#fff";
  const summary = document.createElement("summary");
  summary.textContent = textarea.value.trim() ? "Rodyti nuskaitytą tekstą" : "Įklijuoti lentelę rankiniu būdu";
  summary.style.cursor = "pointer";
  summary.style.fontWeight = "800";
  summary.style.color = "var(--accent-dark)";
  field.replaceWith(details);
  details.append(summary, field);
}

function enhancePriceImportOptionLabels() {
  const table = priceImportParsedTable();
  const signature = `${priceHeadersSignature()}|${table.rows[0]?.join("|") || ""}`;
  document.querySelectorAll("[data-price-import-column]").forEach((select) => {
    if (select.dataset.smartOptionSamples === signature) return;
    Array.from(select.options).forEach((option) => {
      if (option.value === "-1" || option.dataset.smartLabelBase) return;
      option.dataset.smartLabelBase = addonText(option);
      const sample = priceImportSampleFor(Number(option.value));
      const badges = [];
      if (optionLooksLikeWithoutVat(option)) badges.push("be PVM");
      if (optionLooksLikeWithVat(option)) badges.push("su PVM");
      if (normalizeImportLabel(option.textContent).includes("gtin") || normalizeImportLabel(option.textContent).includes("ean")) badges.push("GTIN/EAN");
      option.textContent = `${option.dataset.smartLabelBase}${badges.length ? ` (${badges.join(", ")})` : ""}${sample ? ` - pvz. ${sample}` : ""}`;
    });
    select.dataset.smartOptionSamples = signature;
  });
}

function autoFixPriceImportMapping() {
  const priceSelect = document.querySelector('[data-price-import-column="price"]');
  if (!priceSelect) return;
  const withoutVat = Array.from(priceSelect.options).find(optionLooksLikeWithoutVat);
  const currentPrice = priceSelect.selectedOptions?.[0];
  if (withoutVat && currentPrice && !optionLooksLikeWithoutVat(currentPrice)) {
    const currentText = normalizeImportLabel(addonText(currentPrice));
    if (currentText.includes("list price") || optionLooksLikeWithVat(currentPrice) || currentText === "nenaudoti") {
      if (setPriceImportColumn("price", withoutVat)) return;
    }
  }

  const costSelect = document.querySelector('[data-price-import-column="cost"]');
  const currentCost = costSelect?.selectedOptions?.[0];
  if (!costSelect || costSelect.value === "-1" || optionLooksLikeRetail(currentCost)) {
    if (costSelect && costSelect.value !== "-1" && optionLooksLikeRetail(currentCost)) {
      costSelect.value = "-1";
      costSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    setPriceImportOption("updateCost", false);
  }
}

function priceImportSafetyIssues() {
  const issues = [];
  const priceSelect = document.querySelector('[data-price-import-column="price"]');
  const priceOption = priceSelect?.selectedOptions?.[0];
  const saferPrice = priceSelect ? Array.from(priceSelect.options).find(optionLooksLikeWithoutVat) : null;
  if (priceOption && saferPrice && priceOption.value !== saferPrice.value && optionLooksLikeWithVat(priceOption)) {
    issues.push(`Parinkta kaina su PVM. Pasirinkite „${addonText(saferPrice)}“.`);
  }
  const article = normalizeImportLabel(selectedOptionText("article"));
  if (article.includes("gtin") || article.includes("ean") || article.includes("barcode")) {
    issues.push("Prekės kodui parinktas GTIN/EAN. Rinkitės gamintojo kodą, pvz. Code no.");
  }
  return issues;
}

function renderSmartImportSummary() {
  const mapping = document.querySelector(".price-import-mapping");
  if (!mapping) return;
  let panel = document.querySelector("[data-smart-import-summary]");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "price-import-coach";
    panel.dataset.smartImportSummary = "true";
    mapping.insertAdjacentElement("beforebegin", panel);
  }
  const priceSample = priceImportSampleFor(Number(document.querySelector('[data-price-import-column="price"]')?.value));
  const articleSample = priceImportSampleFor(Number(document.querySelector('[data-price-import-column="article"]')?.value));
  const costText = selectedOptionText("cost") || "Nenaudoti";
  const issues = priceImportSafetyIssues();
  panel.innerHTML = `
    <div class="section-heading compact-heading">
      <h2>Patikra prieš atnaujinimą</h2>
      <span>${issues.length ? "!" : "OK"}</span>
    </div>
    <div class="price-import-coach-list">
      <div class="price-import-coach-tip ${issues.length ? "danger" : "success"}">
        <strong>${issues.length ? "Reikia pataisyti priskyrimą" : "Galima tęsti saugiai"}</strong>
        <span>${issues[0] || `Kodas: ${articleSample || "-"} · kaina be PVM: ${priceSample || "-"} · savikaina: ${costText}`}</span>
      </div>
      <div class="price-import-coach-tip info">
        <strong>Paprasta taisyklė</strong>
        <span>Gamintojo kainininkui dažniausiai reikia tik prekės kodo, pavadinimo, gamintojo ir pardavimo kainos be PVM. Savikainą palikite nenaudoti, jei tai nėra jūsų pirkimo kaina.</span>
      </div>
    </div>
  `;
}

function guardPriceImportApply() {
  const button = document.querySelector('[data-action="apply-price-import"]');
  if (!button) return;
  const issues = priceImportSafetyIssues();
  if (issues.length) {
    button.disabled = true;
    button.title = issues[0];
  }
}

function enhancePriceImportUsability() {
  if (addonPageTitle() !== "Kainininkai") return;
  if (!document.querySelector(".price-import-mapping")) return;
  enhancePriceImportRawText();
  enhancePriceImportOptionLabels();
  autoFixPriceImportMapping();
  renderSmartImportSummary();
  guardPriceImportApply();
}

function addonStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function addonSmartTip({ title, text, tone = "info", label, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `smart-tip ${tone}`;
  button.innerHTML = `
    <span class="work-status-dot"></span>
    <strong>${title}</strong>
    <span>${label}</span>
    <em>${text}</em>
  `;
  button.addEventListener("click", onClick);
  return button;
}

function addonSegmentCount(label) {
  const button = Array.from(document.querySelectorAll(".segment-button")).find((item) =>
    addonText(item).toLowerCase().includes(label.toLowerCase()),
  );
  const match = addonText(button).match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

function enhanceProductsAutopilot() {
  if (addonPageTitle() !== "Prekės") return;
  if (document.querySelector(".products-autopilot")) return;
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar) return;

  const lowStock = addonSegmentCount("Mažas likutis");
  const noPrice = addonSegmentCount("Be kainos");
  const noCost = addonSegmentCount("Be savikainos");
  const tips = [];

  if (lowStock > 0) {
    tips.push({
      title: `${lowStock} prekės laukia papildymo`,
      text: "Vienu paspaudimu paruošiamas pirkimo juodraštis pagal mažo likučio prekes.",
      tone: "danger",
      label: "Paruošti",
      onClick: () => addonClickAction("prepare-low-stock-receipt"),
    });
  }

  if (noPrice > 0 || noCost > 0) {
    tips.push({
      title: "Kainos dar ne visur sutvarkytos",
      text: `${noPrice} be pardavimo kainos, ${noCost} be savikainos. Greičiausia taisyti per gamintojo kainininką.`,
      tone: "warning",
      label: "Įkelti kainininką",
      onClick: () => addonClickPage("price-import"),
    });
  }

  if (!tips.length) {
    tips.push({
      title: "Prekių sąrašas atrodo tvarkingai",
      text: "Kai gausite naują gamintojo kainininką, pradėkite nuo kainininkų importo.",
      tone: "success",
      label: "Kainininkai",
      onClick: () => addonClickPage("price-import"),
    });
  }

  const panel = document.createElement("section");
  panel.className = `smart-tips-panel products-autopilot ${PRODUCTIVITY_MARK}`;
  panel.setAttribute("aria-label", "Prekių autopilotas");
  panel.innerHTML = `
    <div class="section-heading compact-heading">
      <h2>Prekių autopilotas</h2>
      <span>${tips.length}</span>
    </div>
    <div class="smart-tip-list"></div>
  `;
  const list = panel.querySelector(".smart-tip-list");
  tips.slice(0, 2).forEach((tip) => list.appendChild(addonSmartTip(tip)));
  toolbar.parentElement.insertBefore(panel, toolbar);
}

function priceHeadersSignature() {
  const select = document.querySelector("[data-price-import-column]");
  const headers = Array.from(select?.options || [])
    .map(addonText)
    .filter((text) => text && text !== "Nenaudoti");
  return headers.length ? headers.map((text) => text.toLowerCase()).join("|") : "";
}

function priceMappingKey() {
  const signature = priceHeadersSignature();
  return signature ? `${PRICE_MAPPING_KEY_PREFIX}${signature}` : "";
}

function currentPriceMapping() {
  return Object.fromEntries(
    PRICE_MAPPING_FIELDS.map((field) => {
      const select = document.querySelector(`[data-price-import-column="${field}"]`);
      return [field, select?.value || ""];
    }),
  );
}

function priceMappingCanApply(mapping) {
  return PRICE_MAPPING_FIELDS.some((field) => {
    const select = document.querySelector(`[data-price-import-column="${field}"]`);
    return mapping[field] && select && Array.from(select.options).some((option) => option.value === mapping[field]);
  });
}

function storedPriceMapping() {
  const key = priceMappingKey();
  const storage = addonStorage();
  if (!key || !storage) return null;
  try {
    const value = JSON.parse(storage.getItem(key) || "null");
    return value && priceMappingCanApply(value.mapping || {}) ? value.mapping : null;
  } catch {
    return null;
  }
}

function savePriceMapping() {
  const key = priceMappingKey();
  const storage = addonStorage();
  if (!key || !storage) return;
  const mapping = currentPriceMapping();
  if (!priceMappingCanApply(mapping)) return;
  storage.setItem(key, JSON.stringify({ mapping, savedAt: new Date().toISOString() }));
}

function applyPriceMapping(mapping) {
  PRICE_MAPPING_FIELDS.forEach((field) => {
    const select = document.querySelector(`[data-price-import-column="${field}"]`);
    if (select && mapping[field]) {
      select.value = mapping[field];
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  addonClickAction("parse-price-import");
}

function memoryCoachTip(mapping) {
  const item = document.createElement("div");
  item.className = "price-import-coach-tip success";
  item.dataset.smartMappingMemory = "true";
  item.innerHTML = `
    <strong>Atpažinau tokį patį kainininko formatą</strong>
    <span>Galiu pritaikyti anksčiau naudotą stulpelių priskyrimą ir iš karto nuskaityti peržiūrą.</span>
  `;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mini-button";
  button.textContent = "Pritaikyti";
  button.addEventListener("click", () => applyPriceMapping(mapping));
  item.appendChild(button);
  return item;
}

function enhancePriceMappingMemory() {
  if (addonPageTitle() !== "Kainininkai") return;
  const mappingPanel = document.querySelector(".price-import-mapping");
  if (!mappingPanel) return;

  const signature = priceHeadersSignature();
  if (mappingPanel.dataset.smartMappingSignature !== signature) {
    mappingPanel.dataset.smartMappingSignature = signature;
    mappingPanel.addEventListener("change", (event) => {
      if (event.target?.matches?.("[data-price-import-column]")) savePriceMapping();
    });
  }

  const coachList = document.querySelector(".price-import-coach-list");
  if (!coachList || coachList.querySelector("[data-smart-mapping-memory], [data-smart-memory-tip]")) return;

  const stored = storedPriceMapping();
  if (!stored) return;
  const current = currentPriceMapping();
  const differs = PRICE_MAPPING_FIELDS.some((field) => stored[field] && stored[field] !== current[field]);
  if (differs) coachList.prepend(memoryCoachTip(stored));
}

function enhanceProductivity() {
  fixMultilinePriceImportHeader();
  enhanceProductsAutopilot();
  enhancePriceImportUsability();
  enhancePriceMappingMemory();
}

new MutationObserver(() => {
  window.requestAnimationFrame(enhanceProductivity);
}).observe(document.querySelector("#app") || document.body, { childList: true, subtree: true });

window.addEventListener("DOMContentLoaded", enhanceProductivity);
enhanceProductivity();
