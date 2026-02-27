class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.initializeEventListeners();
        // Handle Discord OAuth token in URL hash (after redirect back from Discord)
        this.handleOAuthCallback();
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

        // OAuth buttons
        const googleLogin = document.getElementById('googleLogin');
        if (googleLogin) googleLogin.addEventListener('click', () => this.startGoogleOAuth());
        const discordLogin = document.getElementById('discordLogin');
        if (discordLogin) discordLogin.addEventListener('click', () => this.startDiscordOAuth());
    }

    // ── OAuth: Discord ───────────────────────────────────────────────────────
    startDiscordOAuth() {
        if (typeof OAUTH_CONFIG === 'undefined') {
            this.showNotification('OAuth not configured. Add your Client IDs to oauth-config.js', 'error');
            return;
        }
        if (!OAUTH_CONFIG.discord.clientId || OAUTH_CONFIG.discord.clientId === 'YOUR_DISCORD_CLIENT_ID') {
            this.showNotification('Discord Client ID not set in oauth-config.js', 'error');
            return;
        }
        window.location.href = OAUTH_CONFIG.discord.authUrl;
    }

    // Called on page load — handles the token returned in the URL hash after Discord redirect
    async handleOAuthCallback() {
        if (typeof OAUTH_CONFIG === 'undefined' || typeof parseOAuthHash === 'undefined') return;
        const params = parseOAuthHash();
        if (!params.access_token) return;

        // Clear hash so token is not sitting in the URL bar
        history.replaceState(null, '', window.location.pathname);

        this.showNotification('Signing you in with Discord...', 'info');
        try {
            const discordUser = await OAUTH_CONFIG.discord.fetchUser(params.access_token);
            if (!discordUser || !discordUser.id) {
                this.showNotification('Failed to fetch Discord user.', 'error');
                return;
            }
            // Find existing account linked to this Discord ID, or by email, or create new
            let user = this.users.find(u => u.oauthId === discordUser.id && u.provider === 'discord');
            if (!user && discordUser.email) {
                user = this.users.find(u => u.email && u.email.toLowerCase() === discordUser.email.toLowerCase());
            }
            if (user) {
                // Update OAuth data on existing account
                user.provider = 'discord';
                user.oauthId = discordUser.id;
                if (discordUser.avatar) {
                    user.avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
                }
                if (!user.username && discordUser.username) user.username = discordUser.username;
                this.saveUsers();
            } else {
                // Create new viewer account
                const avatarUrl = discordUser.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
                    : '';
                user = {
                    id: Date.now().toString(),
                    username: discordUser.global_name || discordUser.username,
                    email: discordUser.email || `discord_${discordUser.id}@oauth.local`,
                    password: null,
                    role: 'viewer',
                    provider: 'discord',
                    oauthId: discordUser.id,
                    avatarUrl,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                };
                this.users.push(user);
                this.saveUsers();
            }
            this.loginUser(user);
        } catch (err) {
            console.error('Discord OAuth error:', err);
            this.showNotification('Discord login failed. Please try again.', 'error');
        }
    }

    // ── OAuth: Google ────────────────────────────────────────────────────────
    startGoogleOAuth() {
        if (typeof OAUTH_CONFIG === 'undefined') {
            this.showNotification('OAuth not configured. Add your Client IDs to oauth-config.js', 'error');
            return;
        }
        if (!OAUTH_CONFIG.google.clientId || OAUTH_CONFIG.google.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
            this.showNotification('Google Client ID not set in oauth-config.js', 'error');
            return;
        }
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt();
        } else {
            this.showNotification('Google Sign-In library not loaded', 'error');
        }
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
        if (user.provider) { this.showNotification('This account uses ' + user.provider + ' login. Use the OAuth button.', 'info'); return; }
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

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        const user = this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (!user) { this.showNotification('No account found with that email.', 'error'); return; }
        this.showNotification('Password reset link sent to ' + email, 'success');
        setTimeout(() => this.switchForm('login'), 2500);
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
        const routes = {
            admin: 'dashboard.html',
            'website-editor': 'dashboard.html',
            artist: 'artist-editor.html'
            // viewer and anything else → index.html
        };
        const dest = routes[user.role] || 'index.html';
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

// Google Sign-In callback (called by GSI library)
function handleGoogleOAuth(response) {
    if (!response || !response.credential) return;
    // Decode JWT credential
    const parts = response.credential.split('.');
    if (parts.length !== 3) return;
    let payload;
    try { payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))); }
    catch(e) { console.error('Failed to decode Google credential', e); return; }

    const mgr = window.authManager;
    if (!mgr) return;

    let user = mgr.users.find(u => u.oauthId === payload.sub && u.provider === 'google');
    if (!user && payload.email) {
        user = mgr.users.find(u => u.email && u.email.toLowerCase() === payload.email.toLowerCase());
    }
    if (user) {
        user.provider = 'google';
        user.oauthId = payload.sub;
        if (payload.picture) user.avatarUrl = payload.picture;
        if (!user.username && payload.name) user.username = payload.name;
        mgr.saveUsers();
    } else {
        user = {
            id: Date.now().toString(),
            username: payload.name || payload.email,
            email: payload.email || `google_${payload.sub}@oauth.local`,
            password: null,
            role: 'viewer',
            provider: 'google',
            oauthId: payload.sub,
            avatarUrl: payload.picture || '',
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        mgr.users.push(user);
        mgr.saveUsers();
    }
    mgr.loginUser(user);
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
