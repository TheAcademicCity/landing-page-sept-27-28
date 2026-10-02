(function () {
  var manifest = window.OPTIMIZED_IMAGE_MANIFEST || {};

  /**
   * Site-root image URL for Nginx /images/ alias (works on /best-boarding-school-india/ and /v1/).
   */
  function toRootImageUrl(src) {
    if (src == null || src === "") return src;
    var raw = String(src);
    if (/^https?:\/\//i.test(raw)) return raw;
    var hashIdx = raw.indexOf("#");
    var queryIdx = raw.indexOf("?");
    var cut = raw.length;
    if (queryIdx !== -1) cut = queryIdx;
    else if (hashIdx !== -1) cut = hashIdx;
    var path = raw.slice(0, cut);
    var suffix = raw.slice(cut);
    path = path.replace(/^\.\//, "").replace(/^\/+/, "");
    if (path.indexOf("images/") !== 0) {
      path = "images/" + path.replace(/^\/+/, "");
    }
    return "/" + path + suffix;
  }

  function normalizeSrcset(srcset) {
    if (!srcset) return "";
    return srcset
      .split(",")
      .map(function (part) {
        var trimmed = part.trim();
        if (!trimmed) return "";
        var pieces = trimmed.split(/\s+/);
        pieces[0] = toRootImageUrl(pieces[0]);
        return pieces.join(" ");
      })
      .filter(Boolean)
      .join(", ");
  }

  function normalizeKey(src) {
    if (!src) return "";
    var path = String(src).split("?")[0].split("#")[0];
    try {
      path = decodeURIComponent(path);
    } catch (e) {
      /* keep encoded */
    }
    path = path.replace(/^\.\//, "").replace(/^\/+/, "");
    if (path.indexOf("images/") !== 0) {
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

  window.toRootImageUrl = toRootImageUrl;
  window.getOptimizedImage = lookup;
  window.pickOptimizedSrc = function (src, maxWidth) {
    var entry = lookup(src);
    if (!entry) {
      return { src: toRootImageUrl(src), srcset: "", webp: false, fallback: toRootImageUrl(src) };
    }
    var chosen = maxWidth ? pickVariant(entry, maxWidth) : entry.default;
    var resolvedSrc = toRootImageUrl(chosen || src);
    return {
      src: resolvedSrc,
      srcset: normalizeSrcset(entry.srcset || ""),
      fallback: toRootImageUrl(src),
      webp: true,
    };
  };

  window.buildOptimizedPicture = function (src, imgAttrs, sizes) {
    var opt = lookup(src);
    var imgSrc = toRootImageUrl(src);
    if (!opt) {
      return '<img src="' + imgSrc + '" ' + imgAttrs + ">";
    }
    var sizesAttr = sizes ? ' sizes="' + sizes + '"' : "";
    return (
      "<picture>" +
      '<source type="image/webp" srcset="' +
      normalizeSrcset(opt.srcset || "") +
      '"' +
      sizesAttr +
      ">" +
      '<img src="' +
      imgSrc +
      '" ' +
      imgAttrs +
      ">" +
      "</picture>"
    );
  };
})();
