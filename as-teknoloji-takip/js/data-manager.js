import { SecurityUtils } from './utils.js';

export class DataManager {
    constructor(githubAPI) {
        this.github = githubAPI;
        this.cache = null;
        this.sha = null;
    }

    async loadData() {
        try {
            const { content, sha } = await this.github.getData();
            this.cache = content;
            this.sha = sha;
            return content;
        } catch (error) {
            console.warn('Data Load Error (GitHub):', error);
            console.info('Falling back to local data/payments.json');

            try {
                const response = await fetch('data/payments.json');
                const localData = await response.json();
                this.cache = localData;
                this.sha = 'local-sha-placeholder';
                return localData;
            } catch (localError) {
                console.error('Local Data Load Error:', localError);
                throw error;
            }
        }
    }

    async addPayment(paymentData) {
        if (!this.cache) await this.loadData();

        // Safe ID generation
        const maxId = this.cache.payments.length > 0
            ? Math.max(...this.cache.payments.map(p => p.id))
            : 0;

        const newPayment = {
            id: maxId + 1,
            ...paymentData,
            documentUploaded: false,
            documentURL: ''
        };

        this.cache.payments.push(newPayment);
        await this.save();
        return newPayment;
    }

    async updatePayment(id, updates) {
        if (!this.cache) await this.loadData();

        const index = this.cache.payments.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Payment not found');

        this.cache.payments[index] = {
            ...this.cache.payments[index],
            ...updates
        };

        await this.save();
        return this.cache.payments[index];
    }

    async deletePayment(id) {
        if (!this.cache) await this.loadData();
        this.cache.payments = this.cache.payments.filter(p => p.id !== id);
        await this.save();
    }

    calculateSummary() {
        if (!this.cache) return null;

        const summary = {
            byCurrency: {},
            totalInEUR: {
                previousDebt: 0,
                currentDebt: 0,
                totalDebt: 0,
                paid: 0,
                remaining: 0
            }
        };

        const currencies = ['TRY', 'USD', 'EUR', 'GBP'];
        // Note: internal data uses 'TL' or 'TRY'? 
        // The prompt JSON uses 'TL', the code uses 'TL' in some places and 'TRY' in others.
        // I will standardize on 'TRY' but map 'TL' to 'TRY' if needed.

        // Helper to normalize currency
        const normalize = (c) => c === 'TL' ? 'TRY' : c;

        // Group by currency
        currencies.forEach(curr => {
            const payments = this.cache.payments.filter(p => normalize(p.currency) === normalize(curr));

            summary.byCurrency[curr] = {
                previousDebt: payments.reduce((sum, p) => sum + (p.previousDebt || 0), 0),
                currentDebt: payments.reduce((sum, p) => sum + (p.currentDebt || 0), 0),
                totalDebt: payments.reduce((sum, p) => sum + (p.totalDebt || 0), 0),
                paid: payments.reduce((sum, p) => sum + (p.paid || 0), 0),
                remaining: payments.reduce((sum, p) => sum + (p.remaining || 0), 0)
            };
        });

        // Calculate Total in EUR (using current rates in metadata)
        const rates = this.cache.metadata.currency;
        // rates are: 1 Unit = X TRY.
        // To convert TRY to EUR: Amount / rates.EUR
        // To convert USD to EUR: (Amount * rates.USD) / rates.EUR

        const toEUR = (amount, cur) => {
            if (amount === 0) return 0;
            const c = normalize(cur);
            const amountInTRY = c === 'TRY' ? amount : amount * rates[c];
            return amountInTRY / rates.EUR;
        };

        this.cache.payments.forEach(p => {
            summary.totalInEUR.previousDebt += toEUR(p.previousDebt, p.currency);
            summary.totalInEUR.currentDebt += toEUR(p.currentDebt, p.currency);
            summary.totalInEUR.totalDebt += toEUR(p.totalDebt, p.currency);
            summary.totalInEUR.paid += toEUR(p.paid, p.currency);
            summary.totalInEUR.remaining += toEUR(p.remaining, p.currency);
        });

        return summary;
    }

    async save() {
        try {
            this.cache.summary = this.calculateSummary();
            this.cache.metadata.lastUpdate = new Date().toISOString();

            const result = await this.github.updateData(this.cache, this.sha);
            this.sha = result.content.sha;
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            throw error;
        }
    }

    filterPayments(filters) {
        if (!this.cache) return [];
        let filtered = [...this.cache.payments];

        if (filters.project) {
            filtered = filtered.filter(p => p.projectName === filters.project);
        }

        if (filters.currency) {
            filtered = filtered.filter(p => p.currency === filters.currency);
        }

        if (filters.invoiceStatus) {
            filtered = filtered.filter(p => p.invoiceStatus === filters.invoiceStatus);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.itemName && p.itemName.toLowerCase().includes(search)) ||
                (p.companyName && p.companyName.toLowerCase().includes(search))
            );
        }

        return filtered;
    }
}
