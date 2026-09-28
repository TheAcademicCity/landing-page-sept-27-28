const crypto = require('crypto');

// Hash data using SHA-256
function hashData(input) {
    if (!input) return '';
    return crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex');
}

// Send enhanced conversion to Google Analytics
async function sendEnhancedConversion(email, phone) {
    try {
        // Hash email if present
        const hashedEmail = email ? hashData(email) : '';
        
        // Format phone number (remove non-digits)
        const formattedPhone = phone ? phone.replace(/\D/g, '') : '';

        // Enhanced conversion data
        const enhancedConversionData = {
            event: 'enhanced_conversion',
            enhanced_conversions_data: {
                sha256_email_address: hashedEmail,
                phone_number: formattedPhone
            }
        };

        console.log('Enhanced conversion data prepared:', {
            email: email ? '***@***.***' : 'none',
            phone: formattedPhone ? '***-***-****' : 'none',
            hashedEmail: hashedEmail ? 'hashed' : 'none'
        });

        return enhancedConversionData;

    } catch (error) {
        console.error('Enhanced conversion error:', error);
        throw error;
    }
}

// Send form submission event
async function sendFormSubmission(formData) {
    try {
        const { studentFirstName, studentLastName, phone, email } = formData;
        
        // Send enhanced conversion
        const enhancedData = await sendEnhancedConversion(email, phone);
        
        // Form submission event data
        const formEventData = {
            event: 'form_submission',
            form_type: 'consultation_request',
            student_name: `${studentFirstName} ${studentLastName}`,
            phone: phone?.replace(/\D/g, ''),
            email: email,
            timestamp: new Date().toISOString()
        };

        console.log('Form submission data prepared:', {
            studentName: `${studentFirstName} ${studentLastName}`,
            phone: phone?.replace(/\D/g, '') ? '***-***-****' : 'none',
            email: email ? '***@***.***' : 'none'
        });

        return {
            enhancedConversion: enhancedData,
            formSubmission: formEventData
        };

    } catch (error) {
        console.error('Form submission tracking error:', error);
        throw error;
    }
}

// Send page view event
async function sendPageView(pageName, pageLocation, pageTitle) {
    try {
        const pageViewData = {
            event: 'page_view',
            page_name: pageName,
            page_location: pageLocation,
            page_title: pageTitle,
            timestamp: new Date().toISOString()
        };

        console.log('Page view data prepared:', pageViewData);

        return pageViewData;

    } catch (error) {
        console.error('Page view tracking error:', error);
        throw error;
    }
}

// Send custom event
async function sendEvent(eventName, eventData = {}) {
    try {
        const eventPayload = {
            event: eventName,
            ...eventData,
            timestamp: new Date().toISOString()
        };

        console.log('Event data prepared:', eventPayload);

        return eventPayload;

    } catch (error) {
        console.error('Event tracking error:', error);
        throw error;
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone format
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

module.exports = {
    sendEnhancedConversion,
    sendFormSubmission,
    sendPageView,
    sendEvent,
    isValidEmail,
    isValidPhone,
    hashData
};
