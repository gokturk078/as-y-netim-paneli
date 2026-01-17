// auth.js
const DEFAULT_USER = {
    username: "admin",
    password: "as2026admin",
    fullName: "Sistem Yöneticisi"
};

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    // If we are on the login page and have a token, redirect to dashboard
    if (localStorage.getItem('authToken') && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});

function login(username, password) {
    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
        const sessionToken = btoa(Date.now() + Math.random()).substring(0, 32);
        localStorage.setItem('authToken', sessionToken);
        localStorage.setItem('userData', JSON.stringify({
            username: username,
            fullName: DEFAULT_USER.fullName,
            loginTime: new Date().toISOString()
        }));
        return true;
    }
    return false;
}

// Bind to form if exists
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('errorMessage');
        const btn = loginForm.querySelector('button');
        const originalText = btn.innerHTML;

        // Loading state
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Giriş Yapılıyor...';
        errorMsg.classList.remove('show');

        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 800));

        if (login(usernameInput.value, passwordInput.value)) {
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = 'Kullanıcı adı veya şifre hatalı';
            errorMsg.classList.add('show');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// Logout function
export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Auth check for dashboard
export function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
    }
}
