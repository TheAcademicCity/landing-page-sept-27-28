/**
 * Google Tag Manager dataLayer events (mirrors school-story-makers enhancedConversions.js).
 */
(function (global) {
  function pushDataLayer(payload) {
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push(payload);
  }

  function sendEnhancedConversion(email, phone) {
    try {
      var formattedPhone = phone ? String(phone).replace(/\D/g, '') : '';

      pushDataLayer({
        event: 'enhanced_conversion',
        enhanced_conversions_data: {
          email: email || '',
          phone_number: formattedPhone,
        },
      });
    } catch (error) {
      console.error('Enhanced conversion error:', error);
    }
  }

  function sendFormSubmission(formData) {
    try {
      var firstName =
        formData.studentFirstName || formData.firstName || formData.parentName || '';
      var lastName = formData.studentLastName || formData.lastName || '';
      var phone = formData.phone || formData.phoneValue || '';
      var email = formData.email || '';

      sendEnhancedConversion(email, phone);

      pushDataLayer({
        event: 'form_submission',
        form_type: formData.formType || 'general_inquiry',
        student_name: (firstName + ' ' + lastName).trim(),
        parent_name: formData.parentGuardianName || formData.parentName || '',
        phone: phone ? String(phone).replace(/\D/g, '') : '',
        email: email,
        class: formData.class || formData.classLookingFor || '',
        preferred_campus: formData.preferredCampus || '',
        questions: formData.questions || '',
        selected_reasons: formData.selectedReasons || [],
        child_age: formData.childAge || '',
        visit_date: formData.visitDate || '',
      });
    } catch (error) {
      console.error('Form submission tracking error:', error);
    }
  }

  function sendPageView(pageName) {
    try {
      pushDataLayer({
        event: 'page_view',
        page_name: pageName,
        page_location: global.location.href,
        page_title: document.title,
      });
    } catch (error) {
      console.error('Page view tracking error:', error);
    }
  }

  function sendEvent(eventName, eventData) {
    try {
      var payload = { event: eventName };
      if (eventData && typeof eventData === 'object') {
        Object.keys(eventData).forEach(function (key) {
          payload[key] = eventData[key];
        });
      }
      pushDataLayer(payload);
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  global.LandingAnalytics = {
    sendEnhancedConversion: sendEnhancedConversion,
    sendFormSubmission: function (formData) {
      sendFormSubmission(formData);
      return Promise.resolve();
    },
    sendPageView: sendPageView,
    sendEvent: sendEvent,
  };
})(window);
