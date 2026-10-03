(function () {
  function populateCountryCodeSelect(select) {
    if (!select || select.getAttribute('data-country-codes-ready') === '1') return;

    var list = typeof window.COUNTRY_DIAL_CODES !== 'undefined' ? window.COUNTRY_DIAL_CODES : null;
    if (!list || !list.length) return;

    var defaultIso = select.getAttribute('data-default-iso') || 'IN';
    select.textContent = '';

    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      var option = document.createElement('option');
      option.value = entry.dial;
      option.textContent = entry.iso2 + ' ' + entry.dial;
      option.title = entry.name + ' (' + entry.dial + ')';
      if (entry.iso2 === defaultIso) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.setAttribute('data-country-codes-ready', '1');
  }

  function initCountryCodeSelects() {
    var selects = document.querySelectorAll('select.enquiry-country-code');
    for (var i = 0; i < selects.length; i++) {
      populateCountryCodeSelect(selects[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountryCodeSelects);
  } else {
    initCountryCodeSelects();
  }
})();
