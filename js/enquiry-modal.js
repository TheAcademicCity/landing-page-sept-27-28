(function () {
  /**
   * Enquiry API — must match the host where server/server.js is proxied (or served).
   * Production landing: https://admission-enquiry.theacademiccity.com/... → same-origin /api/enquiry
   * Local static preview: http://localhost:8765 → Node on port 3010
   */
  function getEnquiryApiUrl() {
    if (typeof window.LANDING_ENQUIRY_API === 'string' && window.LANDING_ENQUIRY_API) {
      return window.LANDING_ENQUIRY_API;
    }
    var host = (location.hostname || '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      var port = window.LANDING_API_PORT || '3010';
      return 'http://localhost:' + port + '/api/enquiry';
    }
    return location.origin.replace(/\/$/, '') + '/api/enquiry';
  }

  var ENQUIRY_API = getEnquiryApiUrl();

  var enquiryModal = document.getElementById('enquiryModal');
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

  function getThankYouPageUrl(intent) {
    var url = new URL('thank-you.html', window.location.href);
    if (intent === 'brochure') {
      url.searchParams.set('brochure', '1');
    }
    return url.pathname + url.search;
  }

  function goToThankYouPage(intent) {
    closeEnquiryModal();
    window.location.assign(getThankYouPageUrl(intent));
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
      closeEnquiryModal();
    });
  });

  if (enquiryModal) {
    enquiryModal.addEventListener('click', function (event) {
      if (event.target === enquiryModal || event.target.classList.contains('enquiry-modal-backdrop')) {
        closeEnquiryModal();
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (enquiryModal && enquiryModal.classList.contains('is-open')) closeEnquiryModal();
  });

  if (window.location.hash.replace('#', '').split('?')[0] === 'enquiry') {
    var params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    openEnquiryModal(params.get('intent') === 'brochure' ? 'brochure' : 'general');
  }

  var enquiryPageForm = document.getElementById('enquiryFormPage');
  var enquiryPageSubmit = document.getElementById('enquiryPageSubmitBtn');
  var enquiryPageError = document.getElementById('enquiryPageFormError');

  function getUtmParams() {
    var queryParams = new URLSearchParams(window.location.search);
    return {
      utm_source: queryParams.get('utm_source') || 'Direct-GAds',
      utm_medium: queryParams.get('utm_campaign') || 'unknown',
      utm_campaign: queryParams.get('adgroup') || 'unknown',
      utm_term: queryParams.get('utm_term') || 'none',
      utm_content: queryParams.get('utm_content') || 'none',
      utm_device: queryParams.get('utm_device') || '',
      A: queryParams.get('A') || '',
      G: queryParams.get('G') || '',
      HI: queryParams.get('HI') || '',
    };
  }

  function buildTrackingData(form, intent) {
    return {
      studentFirstName: form.fname.value.trim(),
      studentLastName: form.lname.value.trim(),
      email: form.email.value.trim(),
      phone: form.mobile.value.trim(),
      class: form.selectclass.value,
      preferredCampus: (form.campus && form.campus.value) || 'Bangalore',
      formType: intent === 'brochure' ? 'brochure_download' : 'general_inquiry',
    };
  }

  function buildEnquiryPayload(form, intent) {
    var utm = getUtmParams();
    return {
      fname: form.fname.value.trim(),
      lname: form.lname.value.trim(),
      mobile: form.mobile.value.trim(),
      selectclass: form.selectclass.value,
      campus: (form.campus && form.campus.value) || 'Bangalore',
      email: form.email.value.trim(),
      intent: intent,
      sourcePath: window.location.pathname,
      page_url: window.location.href,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_term: utm.utm_term,
      utm_content: utm.utm_content,
      utm_device: utm.utm_device,
      A: utm.A,
      G: utm.G,
      HI: utm.HI,
    };
  }

  function handleEnquirySubmit(form, options) {
    return function (event) {
      event.preventDefault();
      var submitBtn = options.submitBtn;
      var errorEl = options.errorEl;
      var intent = options.getIntent ? options.getIntent() : options.intent || 'general';
      var defaultLabel = options.getDefaultLabel
        ? options.getDefaultLabel()
        : options.defaultLabel || 'Submit Enquiry';

      if (errorEl) errorEl.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      var trackingPromise =
        window.LandingAnalytics && window.LandingAnalytics.sendFormSubmission
          ? window.LandingAnalytics.sendFormSubmission(buildTrackingData(form, intent))
          : Promise.resolve();

      trackingPromise.then(function () {
        return fetch(ENQUIRY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEnquiryPayload(form, intent)),
      });
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

          form.reset();
          goToThankYouPage(intent);
        })
        .catch(function (error) {
          if (errorEl) {
            errorEl.textContent = error.message || 'Something went wrong. Please try again.';
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = options.getDefaultLabel
              ? options.getDefaultLabel()
              : defaultLabel;
          }
        });
    };
  }

  if (enquiryForm) {
    enquiryForm.addEventListener(
      'submit',
      handleEnquirySubmit(enquiryForm, {
        submitBtn: enquirySubmit,
        errorEl: enquiryError,
        getIntent: function () {
          return currentIntent;
        },
        getDefaultLabel: function () {
          return currentIntent === 'brochure' ? 'Submit & Download Brochure' : 'Submit Enquiry';
        },
      }),
    );
  }

  if (enquiryPageForm) {
    enquiryPageForm.addEventListener(
      'submit',
      handleEnquirySubmit(enquiryPageForm, {
        submitBtn: enquiryPageSubmit,
        errorEl: enquiryPageError,
        getIntent: function () {
          return 'general';
        },
        getDefaultLabel: function () {
          return 'Submit Enquiry';
        },
      }),
    );
  }
})();
