(function () {
  var mobileMq = window.matchMedia('(max-width: 767px)');

  function setMobileFloatLauncherHidden() {
    var salesiq = window.$zoho && window.$zoho.salesiq;
    if (salesiq && salesiq.floatbutton && salesiq.floatbutton.visible) {
      salesiq.floatbutton.visible(mobileMq.matches ? 'hide' : 'show');
    }
    if (!mobileMq.matches) return;
    var floatRoot = document.getElementById('zsiq_float');
    if (floatRoot) {
      floatRoot.style.setProperty('display', 'none', 'important');
      floatRoot.style.setProperty('visibility', 'hidden', 'important');
      floatRoot.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  function scheduleMobileFloatHideRetries() {
    setMobileFloatLauncherHidden();
    var attempt = 0;
    var maxAttempts = 24;
    var timer = setInterval(function () {
      setMobileFloatLauncherHidden();
      attempt += 1;
      if (attempt >= maxAttempts) clearInterval(timer);
    }, 500);
  }

  function initSalesiqMobileLauncher() {
    var salesiq = window.$zoho && window.$zoho.salesiq;
    if (typeof salesiq !== 'undefined' && salesiq && typeof salesiq.ready === 'function') {
      salesiq.ready(scheduleMobileFloatHideRetries);
    } else {
      scheduleMobileFloatHideRetries();
    }
    if (typeof mobileMq.addEventListener === 'function') {
      mobileMq.addEventListener('change', setMobileFloatLauncherHidden);
    } else if (typeof mobileMq.addListener === 'function') {
      mobileMq.addListener(setMobileFloatLauncherHidden);
    }
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () {
        if (mobileMq.matches) setMobileFloatLauncherHidden();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  initSalesiqMobileLauncher();

  function openZohoChat(event) {
    if (event) event.preventDefault();
    var salesiq = window.$zoho && window.$zoho.salesiq;
    if (salesiq && typeof salesiq.floatwindow === 'object' && salesiq.floatwindow.visible) {
      salesiq.floatwindow.visible('show');
      return;
    }
    if (salesiq && typeof salesiq.ready === 'function') {
      salesiq.ready(function () {
        if (salesiq.floatwindow && salesiq.floatwindow.visible) {
          salesiq.floatwindow.visible('show');
        }
      });
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-zoho-chat-open]');
    if (!trigger) return;
    openZohoChat(event);
  });

  window.openTacsZohoChat = openZohoChat;
})();
