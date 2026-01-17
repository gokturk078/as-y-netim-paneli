// utils.js

export const SecurityUtils = {
    // XSS Prevention
    escapeHTML(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Input validation
    validateInput(input, type) {
        switch (type) {
            case 'number':
                return !isNaN(parseFloat(input)) && isFinite(input);
            case 'currency':
                return /^\d+(\.\d{1,2})?$/.test(input);
            case 'text':
                return typeof input === 'string' && input.length > 0;
            default:
                return false;
        }
    },

    // Sanitize form data
    sanitizeFormData(formData) {
        const sanitized = {};
        for (let key in formData) {
            if (typeof formData[key] === 'string') {
                sanitized[key] = this.escapeHTML(formData[key].trim());
            } else {
                sanitized[key] = formData[key];
            }
        }
        return sanitized;
    },

    // Token validation
    isValidToken(token) {
        return token && token.length === 32;
    }
};

export const FormatUtils = {
    formatCurrency(amount, currency = 'TRY') {
        const symbols = {
            TRY: '₺',
            USD: '$',
            EUR: '€',
            GBP: '£'
        };
        const symbol = symbols[currency] || currency;
        return `${symbol} ${parseFloat(amount).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('tr-TR');
    }
};

// Debounce function (generic)
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
