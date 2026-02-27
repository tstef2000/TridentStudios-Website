// Admin Panel Manager
class AdminPanelManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('trident_currentUser'));
        this.users = JSON.parse(localStorage.getItem('trident_users') || '[]');
        this.auditLogs = JSON.parse(localStorage.getItem('trident_audit_logs') || '[]');
        
        // Check if user is admin
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            window.location.href = 'dashboard.html';
        }

        this.initializeEventListeners();
        this.renderUsers();
        this.renderAuditLogs();
        this.initializeChart();
        this.loadSettings();
        this.setupNavigation();
    }

    initializeEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Logout
        document.getElementById('adminLogout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('trident_currentUser');
            window.location.href = 'login.html';
        });

        // Add user
        document.getElementById('addUserBtn').addEventListener('click', () => {
            document.getElementById('addUserModal').style.display = 'flex';
        });

        document.getElementById('closeAddUserModal').addEventListener('click', () => {
            document.getElementById('addUserModal').style.display = 'none';
        });

        document.getElementById('addUserForm').addEventListener('submit', (e) => this.handleAddUser(e));

        // Clear audit log
        document.getElementById('clearAuditBtn').addEventListener('click', () => {
            if (confirm('Clear all audit logs? This cannot be undone.')) {
                this.auditLogs = [];
                localStorage.setItem('trident_audit_logs', JSON.stringify(this.auditLogs));
                this.renderAuditLogs();
                this.showNotification('Audit log cleared', 'success');
            }
        });

        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Save users
        document.getElementById('saveUsersBtn').addEventListener('click', () => {
            localStorage.setItem('trident_users', JSON.stringify(this.users));
            this.logAction('Saved user list', 'Manual save');
            this.showNotification('User changes saved', 'success');
            this.setSaveTime('usersSaveTime');
        });

        // Refresh analytics
        document.getElementById('saveAnalyticsBtn').addEventListener('click', () => {
            this.showNotification('Analytics refreshed', 'success');
            this.setSaveTime('analyticsSaveTime');
        });

        // Refresh visits chart
        document.getElementById('refreshVisitsBtn').addEventListener('click', () => {
            this.initializeChart();
            this.showNotification('Visit data refreshed', 'success');
            this.setSaveTime('visitsSaveTime');
        });

        // Export audit log
        document.getElementById('exportAuditBtn').addEventListener('click', () => {
            const data = JSON.stringify(this.auditLogs, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit-log-' + new Date().toISOString().slice(0,10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Audit log exported', 'success');
        });

        // Update admin name
        document.getElementById('adminName').textContent = this.currentUser.username;
    }

    setupNavigation() {
        // Get all sections and add IDs
        const sections = ['Dashboard', 'Users & Roles', 'Analytics', 'Website Visits', 'Audit Log', 'System Settings'];
        sections.forEach((section, index) => {
            const sectionEl = document.querySelectorAll('.admin-section')[index];
            if (sectionEl) {
                sectionEl.id = section;
            }
        });
    }

    switchSection(sectionName) {
        // Update nav styles
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });

        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const sectionMap = {
            'dashboard': 'Dashboard',
            'users': 'Users & Roles',
            'analytics': 'Analytics',
            'visits': 'Website Visits',
            'audit': 'Audit Log',
            'settings': 'System Settings'
        };

        const sectionId = sectionMap[sectionName];
        document.getElementById(sectionId).classList.add('active');
        document.getElementById('sectionTitle').textContent = sectionId;

        // Re-initialize chart if switching to visits section
        if (sectionName === 'visits') {
            setTimeout(() => this.initializeChart(), 100);
        }
    }

    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';

        this.users.forEach(user => {
            const passwordDisplay = this.maskPassword(user.password);
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div class="table-cell">${user.email}</div>
                <div class="table-cell">${user.username}</div>
                <div class="table-cell password">${passwordDisplay}</div>
                <div class="table-cell role-cell">
                    <select class="role-select" data-user-id="${user.id}">
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                        <option value="artist" ${user.role === 'artist' ? 'selected' : ''}>Artist</option>
                        <option value="website-editor" ${user.role === 'website-editor' ? 'selected' : ''}>Website Editor</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    ${user.role === 'artist' ? `<select class="card-select" data-user-id="${user.id}" style="margin-top:4px;font-size:12px;background:rgba(3,23,35,0.9);border:1px solid rgba(43,179,255,0.2);color:var(--text-light);padding:4px 8px;border-radius:6px;"><option value="1" ${user.artistCardId==='1'?'selected':''}>Card 1</option><option value="2" ${user.artistCardId==='2'?'selected':''}>Card 2</option><option value="3" ${user.artistCardId==='3'?'selected':''}>Card 3</option><option value="4" ${user.artistCardId==='4'?'selected':''}>Card 4</option></select>` : ''}
                </div>
                <div class="table-cell">${new Date(user.createdAt).toLocaleDateString()}</div>
                <div class="table-cell actions">
                    <button class="btn-small btn-delete" data-user-id="${user.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Role change listener
            const roleSelect = row.querySelector('.role-select');
            roleSelect.addEventListener('change', (e) => {
                this.updateUserRole(user.id, e.target.value);
                this.renderUsers(); // re-render to show/hide card selector
            });
            // Card assignment listener (for artist role)
            const cardSelect = row.querySelector('.card-select');
            if (cardSelect) {
                cardSelect.addEventListener('change', (e) => {
                    const u = this.users.find(x => x.id === user.id);
                    if (u) {
                        u.artistCardId = e.target.value;
                        localStorage.setItem('trident_users', JSON.stringify(this.users));
                        this.logAction('Assigned artist card', `${u.email}: card ${e.target.value}`);
                        this.showNotification(`Artist card ${e.target.value} assigned`, 'success');
                    }
                });
            }

            // Delete button
            row.querySelector('.btn-delete').addEventListener('click', () => {
                if (confirm(`Delete user ${user.email}?`)) {
                    this.deleteUser(user.id);
                }
            });

            tableBody.appendChild(row);
        });
    }

    renderAuditLogs() {
        const tableBody = document.getElementById('auditTableBody');
        tableBody.innerHTML = '';

        // Show latest logs first
        const sortedLogs = [...this.auditLogs].reverse().slice(0, 50);

        sortedLogs.forEach(log => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div class="table-cell">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="table-cell">${log.user}</div>
                <div class="table-cell">${log.action}</div>
                <div class="table-cell">${log.details}</div>
            `;
            tableBody.appendChild(row);
        });
    }

    handleAddUser(e) {
        e.preventDefault();
        
        const email = document.getElementById('newUserEmail').value;
        const username = document.getElementById('newUserUsername').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        const artistCardId = role === 'artist' ? (document.getElementById('newUserArtistCard').value || '1') : null;

        if (this.users.find(u => u.email === email)) {
            this.showNotification('User already exists', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            email,
            username,
            password,
            role,
            artistCardId: artistCardId || null,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.push(newUser);
        localStorage.setItem('trident_users', JSON.stringify(this.users));
        
        // Log action
        this.logAction(`Added new user ${email}`, `Role: ${role}`);

        this.showNotification(`User ${email} added successfully`, 'success');
        document.getElementById('addUserForm').reset();
        document.getElementById('addUserModal').style.display = 'none';
        this.renderUsers();
    }

    updateUserRole(userId, newRole) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            localStorage.setItem('trident_users', JSON.stringify(this.users));
            this.logAction(`Updated user role`, `${user.email}: ${newRole}`);
            this.showNotification(`User role updated to ${newRole}`, 'success');
        }
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.users = this.users.filter(u => u.id !== userId);
            localStorage.setItem('trident_users', JSON.stringify(this.users));
            this.logAction(`Deleted user`, user.email);
            this.showNotification('User deleted', 'success');
            this.renderUsers();
        }
    }

    maskPassword(password) {
        if (!password) return '••••••••';
        return password.substring(0, 2) + '•'.repeat(Math.max(0, password.length - 2));
    }

    initializeChart() {
        const ctx = document.getElementById('visitsChart');
        if (!ctx) return;

        // Sample data
        const labels = Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        }).reverse();

        const visitsData = Array.from({length: 30}, () => Math.floor(Math.random() * 200) + 50);

        if (window.visitsChart) {
            window.visitsChart.destroy();
        }

        const chartCanvas = ctx.getContext('2d');
        window.visitsChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Website Visits',
                    data: visitsData,
                    borderColor: '#2bb3ff',
                    backgroundColor: 'rgba(43, 179, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2bb3ff',
                    pointBorderColor: '#062233',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#00d1ff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const index = context.dataIndex;
                                const uniqueVisitors = Math.floor(context.parsed.y * 0.7);
                                const avgTime = Math.floor(Math.random() * 8 + 2);
                                return `Unique: ${uniqueVisitors}\nAvg Time: ${avgTime}m`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e6f6ff'
                        },
                        grid: {
                            color: 'rgba(12, 58, 82, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e6f6ff'
                        },
                        grid: {
                            color: 'rgba(12, 58, 82, 0.3)'
                        }
                    }
                }
            }
        });
    }

    saveSettings() {
        const settings = {
            siteTitle: document.getElementById('siteTitleInput').value,
            siteSubtitle: document.getElementById('siteSubtitleInput').value,
            contactEmail: document.getElementById('contactEmailInput').value,
            discordLink: document.getElementById('discordLinkInput').value,
            enableNotifications: document.getElementById('enableNotifications').checked,
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            enableAnalytics: document.getElementById('enableAnalytics').checked
        };

        // Collect social links
        const socials = {
            discord:   document.getElementById('socialDiscord').value.trim(),
            youtube:   document.getElementById('socialYoutube').value.trim()
        };

        // Also update discord link in settings from socials if provided
        if (socials.discord) settings.discordLink = socials.discord;

        localStorage.setItem('trident_settings', JSON.stringify(settings));
        localStorage.setItem('trident_social_links', JSON.stringify(socials));

        // Persist site content for index.html to pick up
        localStorage.setItem('trident_site_content', JSON.stringify({
            title:    settings.siteTitle,
            subtitle: settings.siteSubtitle
        }));

        this.logAction('Updated system settings', 'Settings & social links saved');
        this.showNotification('All settings saved — live website updated!', 'success');
        this.setSaveTime('settingsSaveTime');
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('trident_settings') || '{}');
        if (settings.siteTitle)    document.getElementById('siteTitleInput').value    = settings.siteTitle;
        if (settings.siteSubtitle) document.getElementById('siteSubtitleInput').value = settings.siteSubtitle;
        if (settings.contactEmail) document.getElementById('contactEmailInput').value = settings.contactEmail;
        if (settings.discordLink)  document.getElementById('discordLinkInput').value  = settings.discordLink;
        document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
        document.getElementById('maintenanceMode').checked     = settings.maintenanceMode || false;
        document.getElementById('enableAnalytics').checked     = settings.enableAnalytics !== false;

        // Load social links
        const socials = JSON.parse(localStorage.getItem('trident_social_links') || '{}');
        if (socials.discord)   document.getElementById('socialDiscord').value   = socials.discord;
        if (socials.youtube)   document.getElementById('socialYoutube').value   = socials.youtube;
    }

    logAction(action, details) {
        const log = {
            timestamp: new Date().toISOString(),
            user: this.currentUser.email,
            action,
            details
        };
        this.auditLogs.push(log);
        localStorage.setItem('trident_audit_logs', JSON.stringify(this.auditLogs));
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification notification-${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    setSaveTime(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = 'Last saved: ' + new Date().toLocaleTimeString();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanelManager();
});
