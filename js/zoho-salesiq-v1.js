(function () {
  var mobileMq = window.matchMedia('(max-width: 767px)');

  function setMobileFloatLauncherHidden() {
    var salesiq = window.$zoho && window.$zoho.salesiq;
    if (!salesiq || !salesiq.floatbutton || !salesiq.floatbutton.visible) return;
    salesiq.floatbutton.visible(mobileMq.matches ? 'hide' : 'show');
  }

  function initSalesiqMobileLauncher() {
    var salesiq = window.$zoho && window.$zoho.salesiq;
    if (!salesiq) return;
    if (typeof salesiq.ready === 'function') {
      salesiq.ready(setMobileFloatLauncherHidden);
    } else {
      setMobileFloatLauncherHidden();
    }
    if (typeof mobileMq.addEventListener === 'function') {
      mobileMq.addEventListener('change', setMobileFloatLauncherHidden);
    } else if (typeof mobileMq.addListener === 'function') {
      mobileMq.addListener(setMobileFloatLauncherHidden);
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
