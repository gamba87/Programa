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
  enhanceProductsAutopilot();
  enhancePriceMappingMemory();
}

new MutationObserver(() => {
  window.requestAnimationFrame(enhanceProductivity);
}).observe(document.querySelector("#app") || document.body, { childList: true, subtree: true });

window.addEventListener("DOMContentLoaded", enhanceProductivity);
enhanceProductivity();
