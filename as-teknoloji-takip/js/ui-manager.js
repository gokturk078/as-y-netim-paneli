// ui-manager.js
import { FormatUtils } from './utils.js';

export class UIManager {
    constructor(dataManager, currencyAPI) {
        this.data = dataManager;
        this.currency = currencyAPI;
    }

    renderStats(summary) {
        if (!summary) return;
        const totalDebt = summary.totalInEUR.totalDebt;
        const totalPaid = summary.totalInEUR.paid;
        const remaining = summary.totalInEUR.remaining;

        // Count no-invoice
        const noInvoice = this.data.cache.payments.filter(p => p.invoiceStatus === 'FATURASIZ').length;

        document.querySelector('.stat-value-total').textContent = FormatUtils.formatCurrency(totalDebt, 'EUR');
        document.querySelector('.stat-value-paid').textContent = FormatUtils.formatCurrency(totalPaid, 'EUR');
        document.querySelector('.stat-value-remaining').textContent = FormatUtils.formatCurrency(remaining, 'EUR');
        document.querySelector('.stat-value-noinvoice').textContent = noInvoice;
    }

    renderTable(payments) {
        const tbody = document.getElementById('payments-tbody');
        tbody.innerHTML = '';

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 2rem;">Kayıt bulunamadı.</td></tr>';
            return;
        }

        payments.forEach((payment, index) => {
            const row = this.createTableRow(payment, index + 1);
            tbody.appendChild(row);
        });
    }

    createTableRow(payment, rowNumber) {
        const tr = document.createElement('tr');
        tr.className = 'table-row';
        tr.dataset.id = payment.id;

        const remainingClass = payment.remaining > 0 ? 'text-error' :
            payment.remaining < 0 ? 'text-success' : 'text-neutral';

        const invoiceBadge = payment.invoiceStatus === 'FATURALI'
            ? '<span class="badge badge-success">Faturalı</span>'
            : '<span class="badge badge-warning">Faturasız</span>';

        tr.innerHTML = `
            <td>${rowNumber}</td>
            <td><strong>${payment.itemName}</strong></td>
            <td>${payment.companyName}</td>
            <td><span class="badge badge-neutral">${payment.serviceType}</span></td>
            <td><span class="badge badge-info">${payment.projectName}</span></td>
            <td><span class="badge badge-neutral">${payment.currency}</span></td>
            <td>${FormatUtils.formatCurrency(payment.previousDebt || 0, payment.currency)}</td>
            <td>${FormatUtils.formatCurrency(payment.currentDebt || 0, payment.currency)}</td>
            <td><strong>${FormatUtils.formatCurrency(payment.totalDebt || 0, payment.currency)}</strong></td>
            <td class="text-success">${FormatUtils.formatCurrency(payment.paid || 0, payment.currency)}</td>
            <td class="${remainingClass}"><strong>${FormatUtils.formatCurrency(payment.remaining, payment.currency)}</strong></td>
            <td>${invoiceBadge}</td>
            <td>
                <div style="display:flex; gap: 0.25rem;">
                    <button class="btn-icon" onclick="window.editPayment(${payment.id})">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button class="btn-icon" onclick="window.deletePayment(${payment.id})">
                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        `;
        return tr;
    }

    updateCurrencyTicker(rates) {
        if (!rates) return;
        document.querySelector('.currency-value-usd').textContent = `₺${rates.USD.toFixed(4)}`;
        document.querySelector('.currency-value-eur').textContent = `₺${rates.EUR.toFixed(4)}`;
        document.querySelector('.currency-value-gbp').textContent = `₺${rates.GBP.toFixed(4)}`;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
