(function () {
  var burger = document.getElementById('siteBurger');
  var drawer = document.getElementById('mobDrawer');
  var widgets = document.querySelectorAll('.widget-stack, .side-action-stack');
  var year = new Date().getFullYear();

  document.querySelectorAll('#footYear, #footYearDesktop').forEach(function (el) {
    el.textContent = year;
  });

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  var footer = document.querySelector('.site-footer');
  if (footer && widgets.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        widgets.forEach(function (stack) {
          stack.classList.toggle('is-hidden', entry.isIntersecting);
        });
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0 });

    observer.observe(footer);
  }
})();
