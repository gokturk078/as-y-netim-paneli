// dashboard.js
import { checkAuth, logout } from './auth.js';
import { GitHubAPI } from './github-api.js';
import { CurrencyAPI } from './currency-api.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';
import { APP_CONFIG } from './config.js';
import { debounce } from './utils.js';

// Init
checkAuth();

const githubAPI = new GitHubAPI();
const currencyAPI = new CurrencyAPI();
const dataManager = new DataManager(githubAPI);
const uiManager = new UIManager(dataManager, currencyAPI);

// Global State
let currentFilters = {
    search: '',
    project: '',
    currency: '',
    invoiceStatus: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDashboard();
    } catch (error) {
        uiManager.showToast('Veri yüklenirken hata oluştu: ' + error.message, 'error');
    }
});

async function initDashboard() {
    // Load rates
    const rates = await currencyAPI.getRates();
    uiManager.updateCurrencyTicker(rates);

    // Load data
    await dataManager.loadData();
    renderAll();

    setupEventListeners();
}

function renderAll() {
    const filteredPayments = dataManager.filterPayments(currentFilters);
    uiManager.renderTable(filteredPayments);
    uiManager.renderStats(dataManager.calculateSummary());
}

function setupEventListeners() {
    // Filter Listeners
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        currentFilters.search = e.target.value;
        renderAll();
    }, 300));

    document.getElementById('projectFilter').addEventListener('change', (e) => {
        currentFilters.project = e.target.value;
        renderAll();
    });

    document.getElementById('currencyFilter').addEventListener('change', (e) => {
        currentFilters.currency = e.target.value;
        renderAll();
    });

    // Theme Toggle
    document.querySelector('.theme-toggle').addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal Handling
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');

    document.getElementById('addPaymentBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = "Yeni Ödeme Ekle";
        document.getElementById('paymentId').value = "";
        form.reset();
        modal.classList.add('active');
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('active'));
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Calculate totals logic (simple client side calc)
        data.previousDebt = parseFloat(data.previousDebt) || 0;
        data.currentDebt = parseFloat(data.currentDebt) || 0;
        data.paid = parseFloat(data.paid) || 0;
        data.totalDebt = data.previousDebt + data.currentDebt;
        data.remaining = data.totalDebt - data.paid;

        try {
            const id = document.getElementById('paymentId').value;
            if (id) {
                await dataManager.updatePayment(parseInt(id), data);
                uiManager.showToast('Ödeme güncellendi', 'success');
            } else {
                await dataManager.addPayment(data);
                uiManager.showToast('Ödeme eklendi', 'success');
            }
            modal.classList.remove('active');
            renderAll();
        } catch (error) {
            uiManager.showToast('Kaydetme başarısız: ' + error.message, 'error');
        }
    });

    // Export PDF (Simple Print)
    document.getElementById('exportBtn').addEventListener('click', () => {
        window.print();
    });

    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        const data = dataManager.filterPayments(currentFilters);
        const headers = ['ID', 'Kalem', 'Firma', 'Hizmet', 'Proje', 'Para Birimi', 'Borç', 'Kalan', 'Durum'];
        const rows = data.map(p => [
            p.id,
            `"${p.itemName}"`, // Quote strings to handle commas
            `"${p.companyName}"`,
            p.serviceType,
            p.projectName,
            p.currency,
            p.totalDebt,
            p.remaining,
            p.invoiceStatus
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `odeme_listesi_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    });
}

// Global functions for inline onclick handlers (simpler than event delegation for now)
window.editPayment = (id) => {
    const payment = dataManager.cache.payments.find(p => p.id === id);
    if (!payment) return;

    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');

    document.getElementById('modalTitle').textContent = "Ödeme Düzenle";
    document.getElementById('paymentId').value = payment.id;

    // Fill form
    form.querySelector('[name="itemName"]').value = payment.itemName;
    form.querySelector('[name="companyName"]').value = payment.companyName;
    form.querySelector('[name="serviceType"]').value = payment.serviceType;
    form.querySelector('[name="projectName"]').value = payment.projectName;
    form.querySelector('[name="currency"]').value = payment.currency;
    form.querySelector('[name="invoiceStatus"]').value = payment.invoiceStatus;

    form.querySelector('[name="previousDebt"]').value = payment.previousDebt;
    form.querySelector('[name="currentDebt"]').value = payment.currentDebt;
    form.querySelector('[name="paid"]').value = payment.paid;

    modal.classList.add('active');
};

window.deletePayment = async (id) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        try {
            await dataManager.deletePayment(id);
            renderAll();
            uiManager.showToast('Kayıt silindi', 'success');
        } catch (error) {
            uiManager.showToast('Silme başarısız', 'error');
        }
    }
};
