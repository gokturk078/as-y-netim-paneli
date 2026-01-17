import { APP_CONFIG } from './config.js';

export class CurrencyAPI {
    constructor() {
        this.baseURL = APP_CONFIG.currencyApiUrl;
        this.cacheKey = 'currency_rates';
        this.cacheTime = APP_CONFIG.cacheDuration;
    }

    isCacheValid() {
        const cached = localStorage.getItem(this.cacheKey);
        if (!cached) return false;

        const { timestamp } = JSON.parse(cached);
        return (Date.now() - timestamp) < this.cacheTime;
    }

    async getRates() {
        if (this.isCacheValid()) {
            const cached = JSON.parse(localStorage.getItem(this.cacheKey));
            return cached.rates;
        }

        try {
            const response = await fetch(`${this.baseURL}/latest?base=EUR&symbols=TRY,USD,GBP`);
            if (!response.ok) throw new Error('Failed to fetch rates');

            const data = await response.json();

            // Calculate rates based on TRY (as requested in prompt logic, usually base is 1)
            // If base is EUR:
            // 1 EUR = X TRY
            // 1 EUR = Y USD
            // To get 1 USD = ? TRY -> X / Y

            const rates = {
                TRY: 1.0000,
                USD: data.rates.TRY / data.rates.USD,
                EUR: data.rates.TRY,
                GBP: data.rates.TRY / data.rates.GBP
            };

            localStorage.setItem(this.cacheKey, JSON.stringify({
                rates,
                timestamp: Date.now(),
                date: data.date
            }));

            return rates;
        } catch (error) {
            console.error('Currency API Error:', error);
            // Fallback values
            return {
                TRY: 1.0000,
                USD: 43.1000,
                EUR: 50.0000,
                GBP: 57.8000
            };
        }
    }

    convert(amount, from, to, rates) {
        if (from === to) return amount;
        // Convert to TRY first (since our rates are based on TRY = 1.0 logic? Wait.)
        // In the getRates logic above:
        // EUR = data.rates.TRY (e.g. 35) -> 1 EUR = 35 TRY.
        // So 'rates' object holds value of 1 Unit in TRY.
        // rates.EUR = 35 means 1 EUR = 35 TRY.

        // algorithm: 
        // AmountInTRY = amount * rates[from]
        // Result = AmountInTRY / rates[to]

        const amountInTRY = from === 'TRY' ? amount : amount * rates[from];
        return to === 'TRY' ? amountInTRY : amountInTRY / rates[to];
    }
}
