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
  let mobileScrollLock = false;
  let mobileScrollTimer = null;

  const mobileMq = window.matchMedia("(max-width: 767px)");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function tabIndex(tabId) {
    return data.tabs.findIndex((tab) => tab.id === tabId);
  }

  function isFeaturedGrid(tab) {
    return tab.layout === "featured-grid" || tab.layout === "featured";
  }

  function tileButton(item, extraClass, mode) {
    const isMasonry = mode === "masonry";
    const isFill = mode === "fill";
    const isHero = mode === "hero";
    const sizeClass = isHero
      ? "home-gallery-tile--hero"
      : isMasonry
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

  function renderMobileFeatured(items) {
    const [featured, ...rest] = items;
    return (
      `<div class="home-gallery-mobile-featured">` +
      (featured ? tileButton(featured, "mobile-hero", "hero") : "") +
      `<div class="home-gallery-masonry home-gallery-masonry--2">` +
      rest.map((item) => tileButton(item, "", "masonry")).join("") +
      `</div></div>`
    );
  }

  function renderPanelContent(tab, isMobile) {
    if (isFeaturedGrid(tab) && !isMobile) {
      return renderFeatured(tab.items);
    }
    if (isMobile && isFeaturedGrid(tab)) {
      return renderMobileFeatured(tab.items);
    }
    if (isMobile) {
      return renderMobileBento(tab.items);
    }
    return renderMasonry(tab.items);
  }

  function renderDesktopPanel(tab) {
    const hidden = tab.id !== activeTab ? " hidden" : "";
    return `<div class="home-gallery-panel" role="tabpanel" data-tab="${tab.id}"${hidden}>${renderPanelContent(tab, false)}</div>`;
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
    const desktop = data.tabs.map((tab) => renderDesktopPanel(tab)).join("");
    const mobileSlides = data.tabs
      .map(
        (tab) =>
          `<div class="home-gallery-mobile-slide" data-tab="${tab.id}">` +
          `<div class="home-gallery-panel" role="tabpanel" data-tab="${tab.id}">` +
          renderPanelContent(tab, true) +
          `</div></div>`,
      )
      .join("");
    const mobile =
      `<div class="home-gallery-mobile-stage" id="homeGalleryMobileStage">` +
      `<div class="home-gallery-mobile-scroller" id="homeGalleryMobileScroller">` +
      mobileSlides +
      `</div></div>`;
    panelsEl.innerHTML =
      `<div class="home-gallery-panels-desktop">${desktop}</div>` +
      `<div class="home-gallery-panels-mobile">${mobile}</div>`;
  }

  function getMobileScroller() {
    return document.getElementById("homeGalleryMobileScroller");
  }

  function syncMobileGalleryHeight(index) {
    if (!mobileMq.matches) return;
    const stage = document.getElementById("homeGalleryMobileStage");
    const slide = root.querySelectorAll(".home-gallery-mobile-slide")[index];
    if (!stage || !slide) return;
    stage.style.height = slide.offsetHeight + "px";
  }

  function scrollGalleryTabIntoView(index) {
    const btn = tabsEl.querySelectorAll(".home-gallery-tab")[index];
    if (!btn) return;
    const targetLeft = btn.offsetLeft - tabsEl.clientWidth / 2 + btn.offsetWidth / 2;
    tabsEl.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }

  function finishMobileScroll(index) {
    if (mobileScrollTimer !== null) {
      window.clearTimeout(mobileScrollTimer);
      mobileScrollTimer = null;
    }
    mobileScrollLock = false;
    syncMobileGalleryHeight(index);
  }

  function scrollMobileGalleryTo(index, behavior) {
    const scroller = getMobileScroller();
    if (!scroller || index < 0) return;

    if (mobileScrollTimer !== null) {
      window.clearTimeout(mobileScrollTimer);
    }

    mobileScrollLock = true;
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: behavior || "smooth" });
    mobileScrollTimer = window.setTimeout(function () {
      finishMobileScroll(index);
    }, behavior === "smooth" ? 450 : 0);
  }

  function updateTabUi(tabId) {
    activeTab = tabId;
    tabsEl.querySelectorAll(".home-gallery-tab").forEach((btn) => {
      const on = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
    root.querySelectorAll(".home-gallery-panels-desktop .home-gallery-panel").forEach((panel) => {
      panel.hidden = panel.dataset.tab !== tabId;
    });
  }

  function setTab(tabId, options) {
    const index = tabIndex(tabId);
    if (index < 0) return;
    updateTabUi(tabId);

    if (mobileMq.matches) {
      syncMobileGalleryHeight(index);
      if (options && options.scrollMobile) {
        scrollMobileGalleryTo(index, options.behavior || "smooth");
        scrollGalleryTabIntoView(index);
      }
    }
  }

  function onMobileGalleryScroll() {
    const scroller = getMobileScroller();
    if (!scroller || !mobileMq.matches) return;

    if (mobileScrollLock) {
      const lockedIndex = tabIndex(activeTab);
      const targetLeft = lockedIndex * scroller.clientWidth;
      if (Math.abs(scroller.scrollLeft - targetLeft) <= 2) {
        finishMobileScroll(lockedIndex);
      }
      return;
    }

    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    const tab = data.tabs[index];
    if (!tab || tab.id === activeTab) return;

    updateTabUi(tab.id);
    scrollGalleryTabIntoView(index);
    syncMobileGalleryHeight(index);
  }

  function bindMobileGalleryImages() {
    root.querySelectorAll(".home-gallery-panels-mobile img").forEach(function (img) {
      function refresh() {
        syncMobileGalleryHeight(tabIndex(activeTab));
      }
      if (img.complete) return;
      img.addEventListener("load", refresh, { once: true });
    });
  }

  function initMobileGallery() {
    const scroller = getMobileScroller();
    if (!scroller) return;

    bindMobileGalleryImages();
    scroller.addEventListener("scroll", onMobileGalleryScroll, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
      root.querySelectorAll(".home-gallery-mobile-slide").forEach((slide, index) => {
        const observer = new ResizeObserver(function () {
          if (data.tabs[index]?.id === activeTab) {
            syncMobileGalleryHeight(index);
          }
        });
        observer.observe(slide);
      });
    }

    window.addEventListener("resize", function () {
      if (!mobileMq.matches) return;
      const index = tabIndex(activeTab);
      scroller.scrollLeft = index * scroller.clientWidth;
      syncMobileGalleryHeight(index);
    });

    syncMobileGalleryHeight(0);
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

  tabsEl.addEventListener("click", function (e) {
    const btn = e.target.closest(".home-gallery-tab");
    if (!btn) return;
    setTab(btn.dataset.tab, { scrollMobile: true });
  });

  panelsEl.addEventListener("click", function (e) {
    const tile = e.target.closest(".home-gallery-tile");
    if (!tile) return;
    openLightbox(tile.dataset.src, tile.dataset.label);
  });

  lightbox?.addEventListener("click", function (e) {
    if (e.target.matches("[data-lightbox-close]")) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });

  buildTabs();
  buildPanels();
  initMobileGallery();
  setTab(activeTab);
})();
