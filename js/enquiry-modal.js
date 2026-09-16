(function () {
  var ENQUIRY_API =
    location.hostname === 'theacademiccity.com' || location.hostname.endsWith('.theacademiccity.com')
      ? '/api/enquiry'
      : 'https://www.theacademiccity.com/api/enquiry';

  var BROCHURE_URL = 'https://www.theacademiccity.com/downloads/tac-brochure-2026.pdf';

  var enquiryModal = document.getElementById('enquiryModal');
  var thankyouModal = document.getElementById('thankyouModal');
  var enquiryForm = document.getElementById('enquiryFormModal');
  var enquirySubtitle = document.getElementById('enquiryModalSubtitle');
  var enquirySubmit = document.getElementById('enquirySubmitBtn');
  var enquiryError = document.getElementById('enquiryFormError');
  var brochureNote = document.getElementById('enquiryBrochureNote');

  var currentIntent = 'general';
  var previousOverflow = '';

  function setIntent(intent) {
    currentIntent = intent === 'brochure' ? 'brochure' : 'general';
    if (!enquiryForm) return;

    enquiryForm.classList.toggle('is-brochure', currentIntent === 'brochure');

    if (enquirySubtitle) {
      enquirySubtitle.textContent =
        currentIntent === 'brochure'
          ? 'Complete the form below and your brochure download will begin automatically.'
          : 'Share your details and our admissions team will reach out with guidance on grades, campus visits and boarding.';
    }

    if (enquirySubmit) {
      enquirySubmit.textContent =
        currentIntent === 'brochure' ? 'Submit & Download Brochure' : 'Submit Enquiry';
    }
  }

  function openEnquiryModal(intent) {
    if (!enquiryModal) return;
    setIntent(intent || 'general');
    enquiryModal.classList.add('is-open');
    enquiryModal.setAttribute('aria-hidden', 'false');
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (enquiryError) enquiryError.textContent = '';
    var firstField = enquiryForm && enquiryForm.querySelector('input, select');
    if (firstField) setTimeout(function () { firstField.focus(); }, 50);
  }

  function closeEnquiryModal() {
    if (!enquiryModal) return;
    enquiryModal.classList.remove('is-open');
    enquiryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow || '';
    if (window.location.hash.indexOf('enquiry') !== -1) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function openThankYouModal() {
    closeEnquiryModal();
    if (!thankyouModal) return;
    thankyouModal.classList.add('is-open');
    thankyouModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeThankYouModal() {
    if (!thankyouModal) return;
    thankyouModal.classList.remove('is-open');
    thankyouModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow || '';
  }

  function parseIntentFromHref(href) {
    if (!href) return 'general';
    try {
      var url = new URL(href, window.location.origin);
      return url.searchParams.get('intent') === 'brochure' ? 'brochure' : 'general';
    } catch (e) {
      return href.indexOf('intent=brochure') !== -1 ? 'brochure' : 'general';
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-enquiry-open], a[href="#enquiry"], a[href^="#enquiry?"]');
    if (!trigger) return;

    event.preventDefault();
    var intent = trigger.getAttribute('data-enquiry-intent') || parseIntentFromHref(trigger.getAttribute('href'));
    openEnquiryModal(intent);
  });

  document.querySelectorAll('[data-enquiry-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (el.closest('#thankyouModal')) closeThankYouModal();
      else closeEnquiryModal();
    });
  });

  if (enquiryModal) {
    enquiryModal.addEventListener('click', function (event) {
      if (event.target === enquiryModal || event.target.classList.contains('enquiry-modal-backdrop')) {
        closeEnquiryModal();
      }
    });
  }

  if (thankyouModal) {
    thankyouModal.addEventListener('click', function (event) {
      if (event.target === thankyouModal || event.target.classList.contains('enquiry-modal-backdrop')) {
        closeThankYouModal();
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (thankyouModal && thankyouModal.classList.contains('is-open')) closeThankYouModal();
    else if (enquiryModal && enquiryModal.classList.contains('is-open')) closeEnquiryModal();
  });

  if (window.location.hash.replace('#', '').split('?')[0] === 'enquiry') {
    var params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    openEnquiryModal(params.get('intent') === 'brochure' ? 'brochure' : 'general');
  }

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (enquiryError) enquiryError.textContent = '';
      if (enquirySubmit) {
        enquirySubmit.disabled = true;
        enquirySubmit.textContent = 'Submitting...';
      }

      var data = {
        fname: enquiryForm.fname.value.trim(),
        lname: enquiryForm.lname.value.trim(),
        mobile: enquiryForm.mobile.value.trim(),
        selectclass: enquiryForm.selectclass.value,
        campus: enquiryForm.campus.value,
        email: enquiryForm.email.value.trim(),
        intent: currentIntent,
        sourcePath: window.location.pathname,
        page_url: window.location.href,
      };

      fetch(ENQUIRY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (response) {
          return response.json().then(function (result) {
            return { ok: response.ok, result: result };
          });
        })
        .then(function (payload) {
          if (!payload.ok || !payload.result.success) {
            throw new Error(payload.result.message || 'Something went wrong. Please try again.');
          }

          enquiryForm.reset();
          openThankYouModal();

          if (currentIntent === 'brochure') {
            var link = document.createElement('a');
            link.href = BROCHURE_URL;
            link.download = 'TAC Brochure 2026.pdf';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            link.remove();
          }
        })
        .catch(function (error) {
          if (enquiryError) {
            enquiryError.textContent = error.message || 'Something went wrong. Please try again.';
          }
        })
        .finally(function () {
          if (enquirySubmit) {
            enquirySubmit.disabled = false;
            enquirySubmit.textContent =
              currentIntent === 'brochure' ? 'Submit & Download Brochure' : 'Submit Enquiry';
          }
        });
    });
  }
})();
