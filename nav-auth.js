// =====================================================
// Trident Studios — Shared Nav Auth Handler (nav-auth.js)
// Include at bottom of every page that has a navbar.
// =====================================================

(function initNavAuth() {
    function getUser() {
        try { return JSON.parse(localStorage.getItem('trident_currentUser')); }
        catch (e) { return null; }
    }

    function getUserRoles(user) {
        if (!user) return ['viewer'];
        if (Array.isArray(user.roles) && user.roles.length) return user.roles;
        if (typeof user.role === 'string' && user.role.trim()) return [user.role];
        return ['viewer'];
    }

    function hasRole(user, role) {
        return getUserRoles(user).includes(role);
    }

    function buildPill(user) {
        const hasAvatar = user.avatarUrl && user.avatarUrl.trim() !== '';
        const initial   = (user.username || user.email || 'U')[0].toUpperCase();
        const roles = getUserRoles(user);
        const hasDash   = hasRole(user, 'admin') || hasRole(user, 'website-editor') || hasRole(user, 'artist');
        const roleLabelMap = { admin: 'Admin', 'website-editor': 'Editor', artist: 'Artist', viewer: 'Viewer' };
        const roleLabel = roles.map(r => roleLabelMap[r] || 'User').join(' • ');

        const pill = document.createElement('div');
        pill.className = 'nav-user-pill';
        pill.setAttribute('role', 'button');
        pill.setAttribute('aria-label', 'User menu');

        pill.innerHTML = `
            <div class="nav-user-avatar ${hasAvatar ? '' : 'nav-user-avatar-initial'}">
                ${hasAvatar ? `<img src="${user.avatarUrl}" alt="${user.username}">` : initial}
            </div>
            <div class="nav-user-meta">
                <span class="nav-user-name">${user.username || 'User'}</span>
                <span class="nav-user-role">${roleLabel}</span>
            </div>
            <i class="fas fa-chevron-down nav-user-caret"></i>

            <div class="nav-user-dropdown" role="menu">
                <div class="nav-dd-header">
                    <div class="nav-dd-avatar ${hasAvatar ? '' : 'nav-dd-avatar-initial'}">
                        ${hasAvatar ? `<img src="${user.avatarUrl}" alt="${user.username}">` : initial}
                    </div>
                    <div>
                        <strong>${user.username || 'User'}</strong>
                        <p>${user.email || ''}</p>
                    </div>
                </div>
                <div class="nav-dd-divider"></div>
                <a href="profile.html" class="nav-dd-item"><i class="fas fa-user-cog"></i> My Profile</a>
                ${hasDash ? `<a href="dashboard.html" class="nav-dd-item"><i class="fas fa-tachometer-alt"></i> Dashboard</a>` : ''}
                <div class="nav-dd-divider"></div>
                <a href="#" class="nav-dd-item nav-dd-logout" id="navLogoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </a>
            </div>
        `;
        return pill;
    }

    function initNav() {
        const user     = getUser();
        const loginBtn = document.getElementById('loginBtn');
        if (!loginBtn) return;

        if (user) {
            const pill = buildPill(user);

            // Toggle dropdown
            pill.addEventListener('click', (e) => {
                if (e.target.closest('#navLogoutBtn')) {
                    e.preventDefault();
                    localStorage.removeItem('trident_currentUser');
                    window.location.href = 'index.html';
                    return;
                }
                // Don't close when clicking a link
                if (e.target.closest('a:not(#navLogoutBtn)')) return;
                pill.classList.toggle('open');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!pill.contains(e.target)) pill.classList.remove('open');
            });

            // Swap out login button
            loginBtn.parentNode.replaceChild(pill, loginBtn);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();
