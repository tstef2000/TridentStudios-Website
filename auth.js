class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.initializeEventListeners();
        window.authManager = this;
    }

    getUserRoles(user) {
        if (!user) return ['viewer'];
        if (Array.isArray(user.roles) && user.roles.length) return user.roles;
        if (typeof user.role === 'string' && user.role.trim()) return [user.role];
        return ['viewer'];
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
        const user = this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
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
        if (this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
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

    async handleForgotPassword(e) {
        e.preventDefault();
        const emailInput = document.getElementById('forgotEmail');
        const email = emailInput.value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('span');
        const originalText = btnText.textContent;
        
        if (!email || !email.includes('@')) {
            this.showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        // Disable button and show loading
        btnText.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Save users to backend for password reset functionality
            const users = this.users;
            await fetch('/api/sync-users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users })
            }).catch(() => {}); // Silently fail if API unavailable
            
            // Request password reset
            const response = await fetch('/api/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'request',
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('If an account exists with that email, a password reset link has been sent.', 'success');
                emailInput.value = '';
                setTimeout(() => this.switchForm('login'), 3000);
            } else {
                this.showNotification(data.error || 'Failed to send reset email. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showNotification('Unable to send reset email. Please check your connection and try again.', 'error');
        } finally {
            btnText.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    loginUser(user) {
        user.lastLogin = new Date().toISOString();
        // Update the user in the users array too
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx !== -1) this.users[idx] = user;
        this.saveUsers();
        this.currentUser = user;
        this.saveCurrentUser();
        this.showNotification('Welcome back, ' + (user.username || user.email) + '!', 'success');

        // Role-based routing
        const roles = this.getUserRoles(user);
        let dest = 'index.html';
        if (roles.includes('admin') || roles.includes('website-editor')) dest = 'dashboard.html';
        else if (roles.includes('artist')) dest = 'artist-editor.html';
        setTimeout(() => { window.location.href = dest; }, 1500);
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
            roles: ['admin'],
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
