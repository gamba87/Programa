const PRICE_IMPORT_GUARD_MARK = "priceImportGuard";

function priceImportGuardText(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function priceImportGuardPageTitle() {
  return priceImportGuardText(document.querySelector(".page-header h1"));
}

function ensureSinglePriceImportCoach() {
  if (priceImportGuardPageTitle() !== "Kainininkai") return;

  const mapping = document.querySelector(".price-import-mapping");
  if (!mapping) return;

  const panels = Array.from(document.querySelectorAll(".price-import-coach"));
  let mainPanel = panels.find((panel) => panel.dataset.smartImportSummary === "true");
  if (!mainPanel) {
    mainPanel = panels.find((panel) => priceImportGuardText(panel).includes("Patikra prieš atnaujinimą"));
  }
  if (!mainPanel) {
    mainPanel = panels[0] || document.createElement("div");
    mainPanel.className = "price-import-coach";
    mainPanel.innerHTML = `
      <div class="section-heading compact-heading">
        <h2>Patikra prieš atnaujinimą</h2>
        <span>OK</span>
      </div>
      <div class="price-import-coach-list">
        <div class="price-import-coach-tip info">
          <strong>Patikrinkite priskyrimą</strong>
          <span>Rinkitės prekės kodą, pavadinimą, gamintoją ir pardavimo kainą be PVM. Savikainą palikite nenaudoti, jei tai nėra jūsų pirkimo kaina.</span>
        </div>
      </div>
    `;
  }

  mainPanel.dataset.smartImportSummary = "true";
  mainPanel.classList.add(PRICE_IMPORT_GUARD_MARK);
  mapping.insertAdjacentElement("beforebegin", mainPanel);

  Array.from(document.querySelectorAll(".price-import-coach"))
    .filter((panel) => panel !== mainPanel)
    .forEach((panel) => panel.remove());
}

new MutationObserver(() => {
  window.requestAnimationFrame(ensureSinglePriceImportCoach);
}).observe(document.querySelector("#app") || document.body, { childList: true, subtree: true });

window.addEventListener("DOMContentLoaded", ensureSinglePriceImportCoach);
ensureSinglePriceImportCoach();
