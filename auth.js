class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const signupForm = document.getElementById('signupForm');
        if (signupForm) signupForm.addEventListener('submit', (e) => this.handleSignup(e));

        const forgotForm = document.getElementById('forgotPasswordForm');
        if (forgotForm) forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));

        const switchToSignup = document.getElementById('switchToSignup');
        if (switchToSignup) switchToSignup.addEventListener('click', (e) => { e.preventDefault(); this.switchForm('signup'); });

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); this.switchForm('login'); });

        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); this.switchForm('forgot'); });

        const backToLogin = document.getElementById('backToLogin');
        if (backToLogin) backToLogin.addEventListener('click', (e) => { e.preventDefault(); this.switchForm('login'); });

        const googleLogin = document.getElementById('googleLogin');
        if (googleLogin) googleLogin.addEventListener('click', () => this.showNotification('Google login integration ready for setup', 'info'));

        const discordLogin = document.getElementById('discordLogin');
        if (discordLogin) discordLogin.addEventListener('click', () => this.showNotification('Discord login integration ready for setup', 'info'));
    }

    switchForm(formType) {
        ['loginForm', 'signupForm', 'forgotPasswordForm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active-form');
        });
        const targets = { login: 'loginForm', signup: 'signupForm', forgot: 'forgotPasswordForm' };
        const target = document.getElementById(targets[formType] || 'loginForm');
        if (target) target.classList.add('active-form');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) { this.showNotification('No account found with that email.', 'error'); return; }
        if (user.password !== password) { this.showNotification('Incorrect password.', 'error'); return; }

        this.loginUser(user);
    }

    handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirmPassword').value;

        if (password !== confirm) { this.showNotification('Passwords do not match.', 'error'); return; }
        if (password.length < 6) { this.showNotification('Password must be at least 6 characters.', 'error'); return; }
        if (this.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            this.showNotification('An account with that email already exists.', 'error'); return;
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            role: 'viewer',
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.push(newUser);
        this.saveUsers();
        this.showNotification('Account created! Signing you in...', 'success');
        setTimeout(() => this.loginUser(newUser), 1500);
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) { this.showNotification('No account found with that email.', 'error'); return; }

        this.showNotification('Password reset link sent to ' + email, 'success');
        setTimeout(() => this.switchForm('login'), 2500);
    }

    loginUser(user) {
        user.lastLogin = new Date().toISOString();
        this.saveUsers();
        this.currentUser = user;
        this.saveCurrentUser();
        this.showNotification('Welcome back, ' + (user.username || user.email) + '!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    saveUsers() {
        localStorage.setItem('trident_users', JSON.stringify(this.users));
    }

    loadUsers() {
        const stored = localStorage.getItem('trident_users');
        if (stored) {
            try { return JSON.parse(stored); } catch(e) {}
        }
        // Default admin account
        const defaults = [{
            id: '1',
            username: 'Trystan',
            email: 'stefanowicz.trystan@gmail.com',
            password: 'Trystan1',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: null
        }];
        localStorage.setItem('trident_users', JSON.stringify(defaults));
        return defaults;
    }

    saveCurrentUser() {
        localStorage.setItem('trident_currentUser', JSON.stringify(this.currentUser));
    }

    loadCurrentUser() {
        try {
            const stored = localStorage.getItem('trident_currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch(e) { return null; }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification notification-${type} show`;
        setTimeout(() => notification.classList.remove('show'), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
