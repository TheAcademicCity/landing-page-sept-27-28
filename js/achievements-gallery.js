(function () {
  var items = window.ACHIEVEMENTS_GALLERY_ITEMS;
  var root = document.getElementById("achievementsGallery");
  if (!items || !root) return;

  function isWords(item) {
    return item.kind === "words";
  }

  function separateWordCards(list) {
    var images = list.filter(function (item) {
      return !isWords(item);
    });
    var words = list.filter(isWords);
    if (!images.length) return list.slice();

    var result = images.slice();
    var stride = Math.max(2, Math.floor(images.length / (words.length + 1)));

    words.forEach(function (word, index) {
      var insertAt = Math.min(result.length, (index + 1) * stride + index);
      while (insertAt > 0 && isWords(result[insertAt - 1])) insertAt += 1;
      while (insertAt < result.length && isWords(result[insertAt])) insertAt += 1;
      result.splice(insertAt, 0, word);
    });

    if (result.length > 1 && isWords(result[0]) && isWords(result[result.length - 1])) {
      var swapWith = result.findIndex(function (item, index) {
        return index > 0 && !isWords(item);
      });
      if (swapWith > 0) {
        var last = result.pop();
        result.splice(swapWith, 0, last);
      }
    }

    return result;
  }

  function splitIntoRows(all) {
    var spaced = separateWordCards(all);
    var rows = [[], [], []];
    spaced.forEach(function (item, index) {
      rows[index % 3].push(item);
    });
    return rows.map(function (row) {
      return separateWordCards(row);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function wordTile(item, seed) {
    var colors = ["achievements-gallery__words--emerald", "achievements-gallery__words--gold"];
    var color = colors[seed % colors.length];
    var lines = item.lines || [];
    return (
      '<div class="achievements-gallery__words ' +
      color +
      '">' +
      lines
        .map(function (line) {
          return '<span>' + escapeHtml(line) + "</span>";
        })
        .join("") +
      "</div>"
    );
  }

  function imageTile(item) {
    var resolved =
      typeof window.pickOptimizedSrc === "function"
        ? window.pickOptimizedSrc(item.src, 320)
        : { src: item.src, srcset: "" };
    var srcsetAttr = resolved.srcset
      ? ' data-srcset="' + escapeHtml(resolved.srcset) + '" sizes="240px"'
      : "";
    return (
      '<article class="achievements-gallery__tile">' +
      '<img data-src="' +
      escapeHtml(resolved.src) +
      '"' +
      srcsetAttr +
      ' src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 480 640\'%3E%3C/svg%3E" alt="' +
      escapeHtml(item.label) +
      '" loading="lazy" decoding="async" width="480" height="640">' +
      (item.category
        ? '<span class="achievements-gallery__cat">' + escapeHtml(item.category) + "</span>"
        : "") +
      '<div class="achievements-gallery__cap">' +
      (item.caption ? "<strong>" + escapeHtml(item.caption) + "</strong>" : "") +
      (item.detail ? "<span>" + escapeHtml(item.detail) + "</span>" : "") +
      "</div></article>"
    );
  }

  function trackHtml(rowItems, delay, offsetClass) {
    var loop = rowItems.concat(rowItems);
    var tiles = loop
      .map(function (item, index) {
        if (isWords(item)) return wordTile(item, index);
        return imageTile(item);
      })
      .join("");

    return (
      '<div class="achievements-gallery__row ' +
      (offsetClass || "") +
      '">' +
      '<div class="achievements-gallery__track" style="animation-delay:' +
      escapeHtml(delay) +
      '">' +
      tiles +
      "</div></div>"
    );
  }

  function renderGallery() {
    if (root.dataset.rendered === "1") return;
    var rows = splitIntoRows(items);
    root.innerHTML =
      trackHtml(rows[0], "0s", "") +
      trackHtml(rows[1], "-40s", "achievements-gallery__row--offset-b") +
      trackHtml(rows[2], "-80s", "achievements-gallery__row--offset-c");
    root.dataset.rendered = "1";
    if (window.loadDeferredImagesIn) {
      window.loadDeferredImagesIn(root);
    }
  }

  if ("IntersectionObserver" in window) {
    var section = document.getElementById("achievements");
    var target = section || root;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          renderGallery();
          observer.disconnect();
        });
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );
    observer.observe(target);
  } else {
    renderGallery();
  }
})();
