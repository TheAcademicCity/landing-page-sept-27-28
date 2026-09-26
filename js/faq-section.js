(function () {
  var lists = document.querySelectorAll('.faq-list[data-faq-accordion]');

  lists.forEach(function (list) {
    var cards = list.querySelectorAll('.faq-card');

    cards.forEach(function (card) {
      var trigger = card.querySelector('.faq-card__trigger');
      if (!trigger) return;

      if (card.classList.contains('is-open')) {
        trigger.setAttribute('aria-expanded', 'true');
      }

      trigger.addEventListener('click', function () {
        var isOpen = card.classList.contains('is-open');

        cards.forEach(function (other) {
          other.classList.remove('is-open');
          var btn = other.querySelector('.faq-card__trigger');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          card.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  var reveals = document.querySelectorAll('.faq-section .faq-reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }
})();
