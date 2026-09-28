(function () {
  const data = window.HOME_GALLERY;
  if (!data) return;

  const root = document.getElementById("homeGallery");
  if (!root) return;

  const tabsEl = root.querySelector(".home-gallery-tabs");
  const panelsEl = root.querySelector(".home-gallery-panels");
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxPanel = lightbox?.querySelector(".gallery-lightbox-panel");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxTitle = lightbox?.querySelector(".gallery-lightbox-title");
  const lightboxPrev = lightbox?.querySelector("[data-lightbox-prev]");
  const lightboxNext = lightbox?.querySelector("[data-lightbox-next]");

  let activeTab = data.tabs[0]?.id ?? "campus";
  let lightboxSlides = [];
  let lightboxIndex = 0;
  let lightboxTouchStartX = 0;
  let lightboxTouchStartY = 0;
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

  function resolveGalleryImage(item, maxWidth) {
    const pick = window.pickOptimizedSrc;
    if (typeof pick === "function") {
      const resolved = pick(item.src, maxWidth || 800);
      return {
        displaySrc: resolved.src || item.src,
        srcset: resolved.srcset || "",
        fullSrc: resolved.src || item.src,
      };
    }
    return { displaySrc: item.src, srcset: "", fullSrc: item.src };
  }

  function tileButton(item, extraClass, mode, deferLoad) {
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
    const maxW = isHero ? 800 : isMasonry ? 600 : 800;
    const imgResolved = resolveGalleryImage(item, maxW);
    const loadingAttr = deferLoad ? "" : ' loading="lazy"';
    const imgTag = deferLoad
      ? `<img data-src="${escapeHtml(imgResolved.displaySrc)}"${
          imgResolved.srcset ? ` data-srcset="${escapeHtml(imgResolved.srcset)}"` : ""
        } src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3C/svg%3E" alt="${escapeHtml(item.alt)}" decoding="async" width="800" height="600"${imgStyle}>`
      : `<img src="${escapeHtml(imgResolved.displaySrc)}"${
          imgResolved.srcset ? ` srcset="${escapeHtml(imgResolved.srcset)}" sizes="(max-width: 767px) 88vw, 280px"` : ""
        } alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async" width="800" height="600"${imgStyle}>`;
    return (
      `<button type="button" class="home-gallery-tile ${sizeClass} ${extraClass}" data-src="${escapeHtml(imgResolved.fullSrc)}" data-label="${escapeHtml(item.label)}" aria-label="View ${escapeHtml(item.label)}"${tileStyle}>` +
      imgTag +
      `<span class="home-gallery-zoom" aria-hidden="true">+</span></button>`
    );
  }

  function renderMasonry(items, deferLoad) {
    return `<div class="home-gallery-masonry">${items.map((item) => tileButton(item, "", "masonry", deferLoad)).join("")}</div>`;
  }

  function renderFeatured(items, deferLoad) {
    const [featured, ...rest] = items;
    const beside = rest.slice(0, 4);
    const masonry = rest.slice(4);
    const slots = ["slot-a", "slot-b", "slot-c", "slot-d"];
    return (
      `<div class="home-gallery-featured">` +
      `<div class="home-gallery-featured-top">` +
      (featured ? tileButton(featured, "is-hero", "fill", deferLoad) : "") +
      beside.map((item, i) => tileButton(item, slots[i], "fill", deferLoad)).join("") +
      `</div>` +
      (masonry.length ? renderMasonry(masonry, deferLoad) : "") +
      `</div>`
    );
  }

  function renderMobileBento(items, deferLoad) {
    const slice = items.slice(0, 6);
    const spans = ["mb-1", "mb-2", "mb-3", "mb-4", "mb-5", "mb-6"];
    return (
      `<div class="home-gallery-bento">` +
      slice.map((item, i) => tileButton(item, spans[i], "fill", deferLoad)).join("") +
      `</div>`
    );
  }

  function renderMobileFeatured(items, deferLoad) {
    const [featured, ...rest] = items;
    return (
      `<div class="home-gallery-mobile-featured">` +
      (featured ? tileButton(featured, "mobile-hero", "hero", deferLoad) : "") +
      `<div class="home-gallery-masonry home-gallery-masonry--2">` +
      rest.map((item) => tileButton(item, "", "masonry", deferLoad)).join("") +
      `</div></div>`
    );
  }

  function renderPanelContent(tab, isMobile, deferLoad) {
    if (isFeaturedGrid(tab) && !isMobile) {
      return renderFeatured(tab.items, deferLoad);
    }
    if (isMobile && isFeaturedGrid(tab)) {
      return renderMobileFeatured(tab.items, deferLoad);
    }
    if (isMobile) {
      return renderMobileBento(tab.items, deferLoad);
    }
    return renderMasonry(tab.items, deferLoad);
  }

  function renderDesktopPanel(tab) {
    const hidden = tab.id !== activeTab ? " hidden" : "";
    const deferLoad = tab.id !== activeTab;
    return `<div class="home-gallery-panel" role="tabpanel" data-tab="${tab.id}"${hidden}>${renderPanelContent(tab, false, deferLoad)}</div>`;
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
        (tab, index) =>
          `<div class="home-gallery-mobile-slide" data-tab="${tab.id}">` +
          `<div class="home-gallery-panel" role="tabpanel" data-tab="${tab.id}">` +
          renderPanelContent(tab, true, index !== 0) +
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
    const activeDesktopPanel = root.querySelector(
      `.home-gallery-panels-desktop .home-gallery-panel[data-tab="${tabId}"]`,
    );
    if (activeDesktopPanel && window.loadDeferredImagesIn) {
      window.loadDeferredImagesIn(activeDesktopPanel);
    }
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
    const slide = root.querySelectorAll(".home-gallery-mobile-slide")[index];
    if (slide && window.loadDeferredImagesIn) {
      window.loadDeferredImagesIn(slide);
    }
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

  function getActiveGalleryPanel() {
    if (mobileMq.matches) {
      return root.querySelector(
        `.home-gallery-panels-mobile .home-gallery-panel[data-tab="${activeTab}"]`,
      );
    }
    return root.querySelector(
      `.home-gallery-panels-desktop .home-gallery-panel[data-tab="${activeTab}"]`,
    );
  }

  function collectLightboxSlides(panel) {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(".home-gallery-tile"))
      .map(function (tile) {
        return { src: tile.dataset.src || "", label: tile.dataset.label || "" };
      })
      .filter(function (slide) {
        return Boolean(slide.src);
      });
  }

  function updateLightboxNavUi() {
    const multi = lightboxSlides.length > 1;
    if (lightboxPrev) {
      lightboxPrev.disabled = !multi;
      lightboxPrev.hidden = !multi;
    }
    if (lightboxNext) {
      lightboxNext.disabled = !multi;
      lightboxNext.hidden = !multi;
    }
  }

  function showLightboxSlide(index) {
    if (!lightboxImg || !lightboxSlides.length) return;
    const total = lightboxSlides.length;
    lightboxIndex = ((index % total) + total) % total;
    const slide = lightboxSlides[lightboxIndex];
    lightboxImg.src = slide.src;
    lightboxImg.alt = slide.label;
    if (lightboxTitle) lightboxTitle.textContent = slide.label;
    updateLightboxNavUi();
  }

  function stepLightbox(delta) {
    if (lightboxSlides.length < 2) return;
    showLightboxSlide(lightboxIndex + delta);
  }

  function openLightbox(src, label) {
    if (!lightbox || !lightboxImg) return;
    lightboxSlides = collectLightboxSlides(getActiveGalleryPanel());
    if (!lightboxSlides.length) {
      lightboxSlides = [{ src: src, label: label || "" }];
    }
    const startIndex = lightboxSlides.findIndex(function (slide) {
      return slide.src === src;
    });
    lightboxIndex = startIndex >= 0 ? startIndex : 0;
    showLightboxSlide(lightboxIndex);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lightboxSlides = [];
    lightboxIndex = 0;
    if (lightboxImg) lightboxImg.src = "";
  }

  function bindLightboxGestures() {
    if (!lightboxPanel) return;

    lightboxPanel.addEventListener(
      "touchstart",
      function (e) {
        if (lightbox.hidden || lightboxSlides.length < 2) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        lightboxTouchStartX = touch.clientX;
        lightboxTouchStartY = touch.clientY;
      },
      { passive: true },
    );

    lightboxPanel.addEventListener(
      "touchend",
      function (e) {
        if (lightbox.hidden || lightboxSlides.length < 2) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - lightboxTouchStartX;
        const dy = touch.clientY - lightboxTouchStartY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) stepLightbox(1);
        else stepLightbox(-1);
      },
      { passive: true },
    );
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
    if (e.target.matches("[data-lightbox-prev]")) stepLightbox(-1);
    if (e.target.matches("[data-lightbox-next]")) stepLightbox(1);
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    else if (e.key === "ArrowRight") stepLightbox(1);
  });

  buildTabs();
  buildPanels();
  if (window.loadAllDeferredImages) {
    window.loadAllDeferredImages();
  }
  bindLightboxGestures();
  initMobileGallery();
  setTab(activeTab);
})();
