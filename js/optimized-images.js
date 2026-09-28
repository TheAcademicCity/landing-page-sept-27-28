(function () {
  var manifest = window.OPTIMIZED_IMAGE_MANIFEST || {};

  function normalizeKey(src) {
    if (!src) return "";
    var path = String(src).split("?")[0].split("#")[0];
    try {
      path = decodeURIComponent(path);
    } catch (e) {
      /* keep encoded */
    }
    path = path.replace(/^\.\//, "");
    if (!path.startsWith("images/")) {
      path = "images/" + path.replace(/^\/+/, "");
    }
    return path;
  }

  function lookup(src) {
    var key = normalizeKey(src);
    return manifest[key] || manifest[key.replace(/^images\//, "")] || null;
  }

  function pickVariant(entry, maxWidth) {
    if (!entry || !entry.variants) return entry && entry.default;
    var best = null;
    var bestW = Infinity;
    Object.keys(entry.variants).forEach(function (k) {
      var w = parseInt(k, 10);
      if (w >= maxWidth && w < bestW) {
        bestW = w;
        best = entry.variants[k];
      }
    });
    return best || entry.default;
  }

  window.getOptimizedImage = lookup;
  window.pickOptimizedSrc = function (src, maxWidth) {
    var entry = lookup(src);
    if (!entry) return { src: src, srcset: "", webp: false };
    var chosen = maxWidth ? pickVariant(entry, maxWidth) : entry.default;
    return {
      src: chosen || src,
      srcset: entry.srcset || "",
      fallback: src,
      webp: true,
    };
  };

  window.buildOptimizedPicture = function (src, imgAttrs, sizes) {
    var opt = lookup(src);
    if (!opt) {
      return "<img src=\"" + src + "\" " + imgAttrs + ">";
    }
    var sizesAttr = sizes ? " sizes=\"" + sizes + "\"" : "";
    return (
      "<picture>" +
      "<source type=\"image/webp\" srcset=\"" +
      opt.srcset +
      "\"" +
      sizesAttr +
      ">" +
      "<img src=\"" +
      src +
      "\" " +
      imgAttrs +
      ">" +
      "</picture>"
    );
  };
})();
