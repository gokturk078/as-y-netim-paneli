// config.js
export const GITHUB_CONFIG = {
    owner: 'GokturkKahriman', // Updated to match user workspace or username if known, defaulting to placeholder or prompt suggestion
    repo: 'as-teknoloji-data',
    token: '', // User needs to provide this
    branch: 'main',
    filePath: 'payments.json'
};

export const APP_CONFIG = {
    currencyApiUrl: 'https://api.frankfurter.dev/v1',
    cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
};
