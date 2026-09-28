(function () {
  var PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

  function activate(img) {
    var src = img.getAttribute("data-src");
    if (!src || img.dataset.loaded === "1") return;
    img.src = src;
    var srcset = img.getAttribute("data-srcset");
    if (srcset) img.srcset = srcset;
    img.dataset.loaded = "1";
    img.removeAttribute("data-src");
    img.removeAttribute("data-srcset");
  }

  function observeImages(images) {
    if (!images.length) return;
    if (!("IntersectionObserver" in window)) {
      images.forEach(activate);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "280px 0px", threshold: 0.01 },
    );
    images.forEach(function (img) {
      io.observe(img);
    });
  }

  window.deferImage = function (img, realSrc, srcset) {
    img.setAttribute("data-src", realSrc);
    if (srcset) img.setAttribute("data-srcset", srcset);
    img.src = PLACEHOLDER;
    img.removeAttribute("srcset");
    return img;
  };

  window.loadDeferredImagesIn = function (root) {
    if (!root) return;
    observeImages(Array.prototype.slice.call(root.querySelectorAll("img[data-src]")));
  };

  window.loadAllDeferredImages = function () {
    observeImages(Array.prototype.slice.call(document.querySelectorAll("img[data-src]")));
  };
})();
