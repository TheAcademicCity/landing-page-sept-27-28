(function () {
  const data = window.HOME_GALLERY;
  if (!data) return;

  const root = document.getElementById("homeGallery");
  if (!root) return;

  const tabsEl = root.querySelector(".home-gallery-tabs");
  const panelsEl = root.querySelector(".home-gallery-panels");
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxTitle = lightbox?.querySelector(".gallery-lightbox-title");

  let activeTab = data.tabs[0]?.id ?? "campus";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function tileButton(item, extraClass, mode) {
    const isMasonry = mode === "masonry";
    const isFill = mode === "fill";
    const sizeClass = isMasonry
      ? "home-gallery-tile--masonry"
      : isFill
        ? "home-gallery-tile--fill"
        : "home-gallery-tile--natural";
    const tileStyle = isMasonry ? ` style="--tile-h:${item.height ?? 220}px"` : "";
    const imgStyle = item.objectPosition ? ` style="object-position:${item.objectPosition}"` : "";
    return (
      `<button type="button" class="home-gallery-tile ${sizeClass} ${extraClass}" data-src="${escapeHtml(item.src)}" data-label="${escapeHtml(item.label)}" aria-label="View ${escapeHtml(item.label)}"${tileStyle}>` +
      `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async" width="800" height="600"${imgStyle}>` +
      `<span class="home-gallery-zoom" aria-hidden="true">+</span></button>`
    );
  }

  function renderMasonry(items) {
    return `<div class="home-gallery-masonry">${items.map((item) => tileButton(item, "", "masonry")).join("")}</div>`;
  }

  function renderFeatured(items) {
    const [featured, ...rest] = items;
    const beside = rest.slice(0, 4);
    const masonry = rest.slice(4);
    const slots = ["slot-a", "slot-b", "slot-c", "slot-d"];
    return (
      `<div class="home-gallery-featured">` +
      `<div class="home-gallery-featured-top">` +
      (featured ? tileButton(featured, "is-hero", "fill") : "") +
      beside.map((item, i) => tileButton(item, slots[i], "fill")).join("") +
      `</div>` +
      (masonry.length ? renderMasonry(masonry) : "") +
      `</div>`
    );
  }

  function renderMobileBento(items) {
    const slice = items.slice(0, 6);
    const spans = ["mb-1", "mb-2", "mb-3", "mb-4", "mb-5", "mb-6"];
    return (
      `<div class="home-gallery-bento">` +
      slice.map((item, i) => tileButton(item, spans[i], "fill")).join("") +
      `</div>`
    );
  }

  function renderPanel(tab, isMobile) {
    const hidden = tab.id !== activeTab ? " hidden" : "";
    const inner =
      tab.layout === "featured" && !isMobile
        ? renderFeatured(tab.items)
        : isMobile && tab.layout === "featured"
          ? renderMobileFeatured(tab.items)
          : isMobile
            ? renderMobileBento(tab.items)
            : renderMasonry(tab.items);

    return `<div class="home-gallery-panel" role="tabpanel" data-tab="${tab.id}"${hidden}>${inner}</div>`;
  }

  function renderMobileFeatured(items) {
    const [featured, ...rest] = items;
    return (
      (featured ? tileButton(featured, "mobile-hero", "fill") : "") +
      `<div class="home-gallery-masonry home-gallery-masonry--2">${rest.map((item) => tileButton(item, "", "masonry")).join("")}</div>`
    );
  }

  function buildTabs() {
    tabsEl.innerHTML = data.tabs
      .map(
        (tab) =>
          `<button type="button" role="tab" class="home-gallery-tab${tab.id === activeTab ? " is-active" : ""}" data-tab="${tab.id}" aria-selected="${tab.id === activeTab ? "true" : "false"}">${escapeHtml(tab.label)}</button>`,
      )
      .join("");
  }

  function buildPanels() {
    const desktop = data.tabs.map((tab) => renderPanel(tab, false)).join("");
    const mobile = data.tabs.map((tab) => renderPanel(tab, true)).join("");
    panelsEl.innerHTML =
      `<div class="home-gallery-panels-desktop">${desktop}</div>` +
      `<div class="home-gallery-panels-mobile">${mobile}</div>`;
  }

  function setTab(tabId) {
    activeTab = tabId;
    tabsEl.querySelectorAll(".home-gallery-tab").forEach((btn) => {
      const on = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
    root.querySelectorAll(".home-gallery-panels-desktop .home-gallery-panel, .home-gallery-panels-mobile .home-gallery-panel").forEach((panel) => {
      const on = panel.dataset.tab === tabId;
      panel.hidden = !on;
    });
  }

  function openLightbox(src, label) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = label;
    if (lightboxTitle) lightboxTitle.textContent = label;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lightboxImg) lightboxImg.src = "";
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-gallery-tab");
    if (!btn) return;
    setTab(btn.dataset.tab);
  });

  panelsEl.addEventListener("click", (e) => {
    const tile = e.target.closest(".home-gallery-tile");
    if (!tile) return;
    openLightbox(tile.dataset.src, tile.dataset.label);
  });

  lightbox?.addEventListener("click", (e) => {
    if (e.target.matches("[data-lightbox-close]")) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });

  buildTabs();
  buildPanels();
  setTab(activeTab);
})();
