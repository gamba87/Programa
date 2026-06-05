const APP_SELECTOR = "#app";
const ADDON_MARK = "smartAddon";

function textOf(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function includesAny(value, words) {
  const normalized = String(value || "").toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function pageTitle() {
  return textOf(document.querySelector(".page-header h1"));
}

function clickPage(page) {
  document.querySelector(`[data-page="${page}"]`)?.click();
}

function clickAction(action) {
  document.querySelector(`[data-action="${action}"]:not(:disabled)`)?.click();
}

function metricValue(label) {
  const metrics = Array.from(document.querySelectorAll(".metric"));
  const metric = metrics.find((item) => textOf(item.querySelector(".metric-label")).toLowerCase() === label.toLowerCase());
  return textOf(metric?.querySelector(".metric-value"));
}

function smartTip({ title, text, tone = "info", label, onClick }) {
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

function enhanceWorkCenter() {
  if (pageTitle() !== "Darbo centras") return;
  const side = document.querySelector(".work-side");
  if (!side || side.querySelector(`.${ADDON_MARK}`) || side.querySelector(".smart-tips-panel")) return;

  const lowStock = metricValue("Ma\u017eas likutis");
  const drafts = metricValue("Juodra\u0161\u010diai");
  const debt = metricValue("Klient\u0173 skola");
  const tips = [];

  if (lowStock && lowStock !== "0") {
    tips.push({
      title: `${lowStock} ma\u017eo liku\u010dio signalai`,
      text: "Prad\u0117kite nuo pirkimo juodra\u0161\u010dio, kad nereik\u0117t\u0173 rankomis rinkti preki\u0173 i\u0161 s\u0105ra\u0161o.",
      tone: "danger",
      label: "Paruo\u0161ti",
      onClick: () => clickAction("prepare-low-stock-receipt"),
    });
  }
  if (drafts && drafts !== "0") {
    tips.push({
      title: `${drafts} neu\u017ebaigti dokumentai`,
      text: "U\u017ebaikite juodra\u0161\u010dius prie\u0161 kuriant naujus dokumentus, kad nesidubliuot\u0173 darbas.",
      tone: "warning",
      label: "Atidaryti",
      onClick: () => clickPage("documents"),
    });
  }
  if (debt && debt !== "0,00 \u20ac") {
    tips.push({
      title: "Yra klient\u0173 skola",
      text: "Skol\u0173 ekranas padeda grei\u010diau paruo\u0161ti priminim\u0105 ir patikrinti neapmok\u0117tas s\u0105skaitas.",
      tone: "warning",
      label: "Skolos",
      onClick: () => clickPage("customer-debts"),
    });
  }

  tips.push({
    title: "Gamintojo kainininkai",
    text: "Kai gaunate Excel su skirtingais stulpeliais, pirmiausia \u012fkelkite j\u012f \u010dia ir tik tada taikykite pakeitimus.",
    tone: "success",
    label: "\u012ekelti",
    onClick: () => clickPage("price-import"),
  });

  const panel = document.createElement("section");
  panel.className = `smart-tips-panel ${ADDON_MARK}`;
  panel.setAttribute("aria-label", "Darbo patarimai");
  panel.innerHTML = `
    <div class="section-heading compact-heading">
      <h2>Kitas lengviausias \u017eingsnis</h2>
      <span>${tips.length}</span>
    </div>
    <div class="smart-tip-list"></div>
  `;
  const list = panel.querySelector(".smart-tip-list");
  tips.slice(0, 3).forEach((tip) => list.appendChild(smartTip(tip)));

  const anchor = side.querySelector(".section-heading");
  side.insertBefore(panel, anchor || side.firstChild);
}

function selectedOptionText(field) {
  const select = document.querySelector(`[data-price-import-column="${field}"]`);
  return {
    select,
    text: textOf(select?.selectedOptions?.[0]),
  };
}

function optionByWords(select, includeWords, excludeWords = []) {
  return Array.from(select?.options || []).find((option) => {
    const optionText = textOf(option);
    return includesAny(optionText, includeWords) && !includesAny(optionText, excludeWords);
  });
}

function setMapping(field, value) {
  const select = document.querySelector(`[data-price-import-column="${field}"]`);
  if (!select) return;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function coachTip({ title, text, tone = "warning", label, onClick }) {
  const item = document.createElement("div");
  item.className = `price-import-coach-tip ${tone}`;
  item.innerHTML = `
    <strong>${title}</strong>
    <span>${text}</span>
  `;
  if (label && onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    item.appendChild(button);
  }
  return item;
}

function priceImportTips() {
  const article = selectedOptionText("article");
  const price = selectedOptionText("price");
  const cost = selectedOptionText("cost");
  const vat = selectedOptionText("vat");
  const tips = [];

  const articleAlternative = optionByWords(article.select, ["code no", "sku", "artikulas", "prek\u0117s kodas", "kodas"], ["gtin", "ean", "barcode"]);
  if (includesAny(article.text, ["gtin", "ean", "barcode"]) && articleAlternative) {
    tips.push({
      title: "Artikulas atrodo kaip EAN / GTIN",
      text: "EAN da\u017enai yra br\u016bk\u0161ninis kodas. Prek\u0117s kortelei geriau naudoti gamintojo kod\u0105.",
      tone: "danger",
      label: `Rinktis ${textOf(articleAlternative)}`,
      onClick: () => setMapping("article", articleAlternative.value),
    });
  }

  const priceWithoutVat = optionByWords(price.select, ["be pvm", "ex vat", "net"]);
  if (includesAny(price.text, ["su pvm", "inc vat", "gross"]) && priceWithoutVat) {
    tips.push({
      title: "Kaina parinkta su PVM",
      text: "Sistema pardavimo kain\u0105 saugo be PVM, tod\u0117l saugiau rinktis stulpel\u012f be PVM.",
      tone: "warning",
      label: `Rinktis ${textOf(priceWithoutVat)}`,
      onClick: () => setMapping("price", priceWithoutVat.value),
    });
  }

  if (vat.select && includesAny(vat.text, ["kaina", "price", "amount", "suma"])) {
    tips.push({
      title: "PVM stulpelis pana\u0161us \u012f kain\u0105",
      text: "Jeigu atskiro PVM tarifo n\u0117ra, palikite PVM nepriskirt\u0105. Bus naudojama numatyta reik\u0161m\u0117.",
      tone: "danger",
      label: "PVM nenaudoti",
      onClick: () => setMapping("vat", ""),
    });
  }

  if (cost.text && price.text && cost.text === price.text) {
    tips.push({
      title: "Savikaina ir pardavimo kaina ta pati",
      text: "Patikrinkite, ar gamintojas tikrai pateik\u0117 savikain\u0105. Da\u017enai kainininke b\u016bna tik ma\u017emenin\u0117 kaina.",
      tone: "warning",
    });
  }

  if (!tips.length) {
    tips.push({
      title: "Priskyrimas atrodo tvarkingai",
      text: "Per\u017ei\u016br\u0117kite kelias pirmas eilutes ir tik tada spauskite \"Atnaujinti prekes\".",
      tone: "success",
    });
  }

  return tips.slice(0, 4);
}

function enhancePriceImport() {
  if (pageTitle() !== "Kainininkai") return;
  const mapping = document.querySelector(".price-import-mapping");
  if (!mapping || document.querySelector(`.${ADDON_MARK}.price-import-coach`) || document.querySelector(".price-import-coach")) return;

  const tips = priceImportTips();
  const panel = document.createElement("div");
  panel.className = `price-import-coach ${ADDON_MARK}`;
  panel.innerHTML = `
    <div class="section-heading compact-heading">
      <h2>Importo pagalbininkas</h2>
      <span>${tips.length}</span>
    </div>
    <div class="price-import-coach-list"></div>
    <div class="form-actions price-import-coach-actions">
      <button class="button secondary" type="button" data-smart-parse>Nuskaityti dar kart\u0105</button>
    </div>
  `;
  const list = panel.querySelector(".price-import-coach-list");
  tips.forEach((tip) => list.appendChild(coachTip(tip)));
  panel.querySelector("[data-smart-parse]")?.addEventListener("click", () => clickAction("parse-price-import"));
  mapping.insertAdjacentElement("afterend", panel);
}

function enhance() {
  enhanceWorkCenter();
  enhancePriceImport();
}

const observer = new MutationObserver(() => {
  window.requestAnimationFrame(enhance);
});

observer.observe(document.querySelector(APP_SELECTOR) || document.body, {
  childList: true,
  subtree: true,
});

window.addEventListener("DOMContentLoaded", enhance);
enhance();
