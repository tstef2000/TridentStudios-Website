// ============================================================
// Trident Studios — Website Editor (Iframe-based live editing)
// ============================================================

class WebsiteEditor {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('trident_currentUser'));

        const roles = this.getUserRoles(this.currentUser);
        if (!this.currentUser || (!roles.includes('website-editor') && !roles.includes('admin'))) {
            window.location.href = 'dashboard.html';
            return;
        }

        this.iframe         = document.getElementById('websitePreviewFrame');
        this.canvas         = document.getElementById('canvasContent'); // compat shim
        this.selectedEl     = null;
        this.pendingChanges = {};
        this.undoStack = [];
        this.redoStack = [];
        this.supportedPages = [
            'index.html',
            'artists.html',
            'socials.html',
            'profile.html',
            'dashboard.html',
            'admin-panel.html',
            'artist-editor.html',
            'artist-portfolio.html',
            'login.html',
            'privacy-policy.html',
            'terms-of-service.html'
        ];
        this.currentPage = localStorage.getItem('trident_editor_current_page') || 'index.html';
        // Allow pages with querystrings (e.g. artist-portfolio.html?id=5)
        if (!this.supportedPages.includes(this.currentPage.split('?')[0])) this.currentPage = 'index.html';

        this.initEditorControls();
        this.iframe.addEventListener('load', () => this.initIframeEditing());
        this.loadPage(this.currentPage);
        this.loadPortfolioData();
        this.updateDbStatusBadge();
        this.logAction('Opened editor', 'Website editor session started');
    }

    getUserRoles(user) {
        if (!user) return ['viewer'];
        if (Array.isArray(user.roles) && user.roles.length) return user.roles;
        if (typeof user.role === 'string' && user.role.trim()) return [user.role];
        return ['viewer'];
    }

    // ── Inject editing helpers into the iframe after it loads ──────────────
    initIframeEditing() {
        let doc;
        try { doc = this.iframe.contentWindow.document; } catch (e) { return; }

        const existing = doc.getElementById('ts-editor-styles');
        if (existing) existing.remove();

        const style = doc.createElement('style');
        style.id = 'ts-editor-styles';
        style.textContent = `
            .ts-edit-bar {
                position: fixed; top: 0; left: 0; right: 0;
                background: rgba(1, 12, 20, 0.97);
                border-bottom: 2px solid rgba(43,179,255,0.4);
                padding: 7px 16px;
                display: flex; align-items: center; gap: 12px;
                font-family: 'Space Grotesk', sans-serif;
                font-size: 13px; color: #e6f6ff;
                z-index: 999999; pointer-events: none;
            }
            .ts-edit-bar-badge {
                background: rgba(43,179,255,0.18); border: 1px solid rgba(43,179,255,0.4);
                color: #2bb3ff; font-size: 10px; font-weight: 700;
                letter-spacing: 1px; padding: 3px 8px; border-radius: 4px;
            }
            .ts-selectable { cursor: pointer !important; }
            .ts-selectable:hover { outline: 2px dashed rgba(43,179,255,0.6) !important; outline-offset: 3px; }
            .ts-selected { outline: 2px solid #2bb3ff !important; outline-offset: 3px;
                box-shadow: 0 0 0 5px rgba(43,179,255,0.15) !important; }
        `;
        doc.head.appendChild(style);

        // Add a small in-iframe editor bar with Undo/Redo and badge
        const existingBar = doc.getElementById('ts-edit-bar');
        if (existingBar) existingBar.remove();
        const editBar = doc.createElement('div');
        editBar.className = 'ts-edit-bar';
        editBar.innerHTML = `<div class="ts-edit-bar-badge">EDITOR</div><div style="flex:1"></div><div style="display:flex;gap:8px;"><button id="ts-undo-btn" style="pointer-events:auto;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#dff6ff;padding:6px 10px;border-radius:6px;">Undo</button><button id="ts-redo-btn" style="pointer-events:auto;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#dff6ff;padding:6px 10px;border-radius:6px;">Redo</button></div>`;
        editBar.style.pointerEvents = 'auto';
        doc.body.appendChild(editBar);
        // wire undo/redo to parent editor instance
        const undoBtn = doc.getElementById('ts-undo-btn');
        const redoBtn = doc.getElementById('ts-redo-btn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.redo());

        const SELECTORS = 'h1, h2, h3, h4, h5, p, a, button, .hero-title, .hero-subtitle, .section-title, .service-card h3, .service-card p, .portfolio-item h3, .portfolio-item p';
        doc.querySelectorAll(SELECTORS).forEach(el => {
            if (el.closest('.ts-edit-bar')) return;
            el.classList.add('ts-selectable');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                doc.querySelectorAll('.ts-selected').forEach(s => s.classList.remove('ts-selected'));
                el.classList.add('ts-selected');
                this.selectedEl = el;
                this.updatePropertiesPanel(el);
            }, true);
        });

        // Prevent navigation away while in edit mode
        doc.querySelectorAll('a[href]').forEach(a => {
            if (!a.closest('.ts-edit-bar')) {
                a.addEventListener('click', e => e.preventDefault(), true);
            }
        });



        // Ensure videos play
        doc.querySelectorAll('video[autoplay]').forEach(v => v.play().catch(() => {}));
    }

    // ── Properties panel for selected element ─────────────────────────────
    updatePropertiesPanel(el) {
        const panel = document.getElementById('propertiesPanel');
        const tag   = el.tagName.toLowerCase();
        panel.innerHTML = `
            <div class="property-item">
                <label>Selected element</label>
                <p style="color:#2bb3ff;font-size:12px;margin:4px 0 12px;">&lt;${tag}&gt;</p>
            </div>
            <div class="property-item">
                <label>HTML Content</label>
                <textarea id="elHtmlInput" style="width:100%;height:90px;padding:8px;
                    background:rgba(3,23,35,0.85);color:#e6f6ff;
                    border:1px solid rgba(43,179,255,0.3);border-radius:6px;
                    resize:vertical;font-size:12px;font-family:monospace;">${el.innerHTML}</textarea>
                <button id="applyHtmlBtn" style="margin-top:8px;width:100%;padding:9px;
                    background:linear-gradient(135deg,#2bb3ff,#00d1ff);color:#031723;
                    border:none;border-radius:7px;font-weight:700;cursor:pointer;font-size:13px;">
                    &#9998; Apply Changes
                </button>
            </div>
            ${tag === 'a' ? `
            <div class="property-item" style="margin-top:12px;">
                <label>Link Text</label>
                <input type="text" id="elTextInput"
                    style="width:100%;padding:8px;background:rgba(3,23,35,0.85);color:#e6f6ff;
                    border:1px solid rgba(43,179,255,0.3);border-radius:6px;font-size:13px;">
            </div>
            <div class="property-item" style="margin-top:12px;">
                <label>Link URL</label>
                <input type="text" id="elHrefInput"
                    placeholder="https://..."
                    style="width:100%;padding:8px;background:rgba(3,23,35,0.85);color:#e6f6ff;
                    border:1px solid rgba(43,179,255,0.3);border-radius:6px;font-size:13px;">
            </div>` : ''}
        `;

        document.getElementById('applyHtmlBtn').addEventListener('click', () => {
            el.innerHTML = document.getElementById('elHtmlInput').value;
            el.dataset.tsChanged = 'true';
            this.savePendingChanges();
            this.showNotification('Content updated', 'success');
        });

        const hrefInput = document.getElementById('elHrefInput');
        if (hrefInput) {
            hrefInput.value = el.getAttribute('href') || '';
            hrefInput.addEventListener('input', e => {
                el.href = e.target.value;
                el.dataset.tsChanged = 'true';
                this.savePendingChanges();
            });
        }

        const textInput = document.getElementById('elTextInput');
        if (textInput) {
            textInput.value = el.textContent;
            textInput.addEventListener('input', e => {
                el.textContent = e.target.value;
                el.dataset.tsChanged = 'true';
                this.savePendingChanges();
            });
        }
    }

    // ── Wire up all editor controls ────────────────────────────────────────
    initEditorControls() {
        document.getElementById('previewBtn').addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'flex';
            const previewFrame = document.getElementById('previewModalFrame');
            if (previewFrame) previewFrame.src = this.currentPage;
            this.logAction('Previewed website', 'Full preview opened');
        });

        document.getElementById('closePreviewBtn').addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'none';
        });

        document.getElementById('publishBtn').addEventListener('click', () => this.publish());

        const pageSelector = document.getElementById('pageSelector');
        if (pageSelector) {
            // Populate artist portfolio pages dynamically from config
            try {
                if (typeof ARTIST_CONFIG !== 'undefined' && Array.isArray(ARTIST_CONFIG.artistsPage)) {
                    ARTIST_CONFIG.artistsPage.forEach(artist => {
                        const opt = document.createElement('option');
                        opt.value = `artist-portfolio.html?id=${artist.id}`;
                        opt.textContent = `${artist.name} Portfolio`;
                        pageSelector.appendChild(opt);
                    });
                }
            } catch (e) {
                // ignore if config not available
            }

            // Set selector to current page (may include querystring)
            try {
                pageSelector.value = this.currentPage;
                if (pageSelector.value !== this.currentPage) {
                    // No matching option; default to index
                    pageSelector.value = 'index.html';
                }
            } catch (e) {
                pageSelector.value = 'index.html';
            }

            pageSelector.addEventListener('change', (e) => {
                this.loadPage(e.target.value);
            });
        }

        document.getElementById('desktopBtn').addEventListener('click', () => {
            this.iframe.classList.remove('mobile-view');
            document.getElementById('desktopBtn').classList.add('active');
            document.getElementById('mobileBtn').classList.remove('active');
        });

        document.getElementById('mobileBtn').addEventListener('click', () => {
            this.iframe.classList.add('mobile-view');
            document.getElementById('mobileBtn').classList.add('active');
            document.getElementById('desktopBtn').classList.remove('active');
        });

        document.getElementById('bgColorInput').addEventListener('input', e => {
            if (this.selectedEl) { this.selectedEl.style.backgroundColor = e.target.value; this.savePendingChanges(); }
        });
        document.getElementById('textColorInput').addEventListener('input', e => {
            if (this.selectedEl) { this.selectedEl.style.color = e.target.value; this.savePendingChanges(); }
        });
        document.getElementById('fontSizeInput').addEventListener('input', e => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            if (this.selectedEl) { this.selectedEl.style.fontSize = e.target.value + 'px'; this.savePendingChanges(); }
        });
        document.getElementById('paddingInput').addEventListener('input', e => {
            if (this.selectedEl) { this.selectedEl.style.padding = e.target.value + 'px'; this.savePendingChanges(); }
        });

        // Sidebar elements — click to inject into iframe
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('click', () => this.injectElement(item.dataset.type));
            // Drag support: set transfer type
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type || '');
            });
        });

        const loadPortfolioBtn = document.getElementById('loadPortfolioBtn');
        if (loadPortfolioBtn) {
            loadPortfolioBtn.addEventListener('click', () => this.loadPortfolioData());
        }

        const savePortfolioBtn = document.getElementById('savePortfolioBtn');
        if (savePortfolioBtn) {
            savePortfolioBtn.addEventListener('click', () => this.savePortfolioData());
        }
    }

    async loadPortfolioData() {
        const input = document.getElementById('portfolioJsonInput');
        if (!input) return;

        try {
            const res = await fetch('/api/portfolio.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch portfolio');
            const data = await res.json();
            input.value = JSON.stringify(data, null, 2);
        } catch (e) {
            this.showNotification('Failed to load portfolio data', 'error');
        }
    }

    async savePortfolioData() {
        const input = document.getElementById('portfolioJsonInput');
        if (!input) return;

        let payload;
        try {
            payload = JSON.parse(input.value || '{"items":[]}');
        } catch (e) {
            this.showNotification('Portfolio JSON is invalid', 'error');
            return;
        }

        if (!Array.isArray(payload.items)) {
            this.showNotification('Portfolio JSON must include an items array', 'error');
            return;
        }

        try {
            const res = await fetch('/api/portfolio.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!result.success) {
                this.showNotification(result.error || 'Failed to save portfolio data', 'error');
                return;
            }

            this.showNotification('Portfolio saved to ' + (result.storage || 'storage'), 'success');
            this.logAction('Saved portfolio', 'Portfolio manager save');
            if (this.currentPage === 'index.html') {
                this.iframe.src = this.currentPage;
            }
        } catch (e) {
            this.showNotification('Failed to save portfolio data', 'error');
        }
    }

    async updateDbStatusBadge() {
        const badge = document.getElementById('dbStatusBadge');
        if (!badge) return;

        try {
            const res = await fetch('/api/db-status.php', { cache: 'no-store' });
            const data = await res.json();
            if (data.dbConnected) {
                badge.textContent = 'DB: Connected';
                badge.style.borderColor = 'rgba(76, 175, 80, 0.45)';
                badge.style.color = '#9de4a6';
            } else {
                badge.textContent = 'DB: File Fallback';
                badge.style.borderColor = 'rgba(255, 193, 7, 0.45)';
                badge.style.color = '#ffd873';
            }
        } catch (e) {
            badge.textContent = 'DB: Status Unknown';
            badge.style.borderColor = 'rgba(193, 67, 79, 0.45)';
            badge.style.color = '#ff9fa8';
        }
    }

    loadPage(page) {
        // Accept pages with optional querystring, e.g. artist-portfolio.html?id=5
        const base = (page || '').split('?')[0];
        if (!this.supportedPages.includes(base)) return;
        this.currentPage = page;
        localStorage.setItem('trident_editor_current_page', page);
        this.iframe.src = page;

        const pageLabel = document.getElementById('currentPageLabel');
        if (pageLabel) {
            pageLabel.innerHTML = `<i class="fas fa-globe" style="color: var(--primary-color);"></i> ${page}`;
        }

        this.showNotification('Switched editor to ' + page, 'info');
    }

    // ── Inject a new element into the live iframe ──────────────────────────
    injectElement(type) {
        let doc;
        try { doc = this.iframe.contentWindow.document; } catch(e) { return; }

        const wrapper = doc.createElement('div');
        wrapper.style.cssText = 'margin:20px;padding:20px;border:2px dashed rgba(43,179,255,0.4);border-radius:10px;position:relative;z-index:9998;';

        const templates = {
            heading:   '<h2 style="color:#e6f6ff;font-family:Bebas Neue,sans-serif;font-size:40px;margin:0;">New Heading</h2>',
            paragraph: '<p style="color:#e6f6ff;line-height:1.7;margin:0;">Click to edit this paragraph.</p>',
            button:    '<button style="background:linear-gradient(135deg,#2bb3ff,#00d1ff);color:#031723;padding:13px 32px;border:none;border-radius:9px;font-weight:700;font-size:15px;cursor:pointer;">New Button</button>',
            image:     '<div style="background:rgba(6,34,51,0.9);border:1px solid rgba(43,179,255,0.2);width:200px;height:160px;display:flex;align-items:center;justify-content:center;border-radius:8px;"><span style="font-size:40px;opacity:0.3;">&#128247;</span></div>',
            section:   '<div style="padding:60px 40px;text-align:center;background:rgba(6,34,51,0.85);border-radius:10px;"><h2 style="color:#e6f6ff;font-family:Bebas Neue,sans-serif;font-size:42px;margin-bottom:12px;">New Section</h2><p style="color:#e6f6ff;opacity:0.8;">Section content here</p></div>',
            card:      '<div style="background:rgba(6,34,51,0.9);border:1px solid rgba(43,179,255,0.18);padding:28px;border-radius:12px;max-width:320px;"><h3 style="color:#e6f6ff;margin:0 0 10px;">Card Title</h3><p style="color:#e6f6ff;opacity:0.8;font-size:14px;margin:0;">Card content goes here.</p></div>',
            form:      '<form><input type="text" placeholder="Your Name" style="display:block;width:100%;margin-bottom:10px;padding:12px 14px;background:rgba(3,23,35,0.85);color:#e6f6ff;border:1px solid rgba(43,179,255,0.25);border-radius:8px;font-size:14px;box-sizing:border-box;"><button type="submit" style="padding:12px 30px;background:linear-gradient(135deg,#2bb3ff,#00d1ff);color:#031723;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Submit</button></form>'
        };

        // Support media presets when using the inject button (non-drag)
        if (type.startsWith('media-')) {
            const aspect = type.replace('media-', '');
            wrapper.innerHTML = `<div class="editor-media media-${aspect}" style="width:320px;height:320px;">
                <div class="media-inner" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(6,34,51,0.9);border:1px dashed rgba(43,179,255,0.12);">
                    <button class="media-upload-btn" style="background:none;border:none;color:var(--primary-color);font-size:18px;cursor:pointer;"><i class="fas fa-cloud-upload-alt"></i> Upload</button>
                    <input type="file" accept="image/*,video/*" style="display:none;" class="media-file-input">
                </div>
            </div>` + `<button onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;background:rgba(193,67,79,0.85);color:#fff;border:none;border-radius:5px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:600;">&#10005; Remove</button>`;
            const input = wrapper.querySelector('.media-file-input');
            const btn = wrapper.querySelector('.media-upload-btn');
            btn.addEventListener('click', () => input.click());
            input.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const isVideo = file.type.startsWith('video/');
                btn.textContent = 'Uploading...';
                if (isVideo) {
                    const form = new FormData(); form.append('video', file);
                    try {
                        const res = await fetch('/api/upload-video.php', { method: 'POST', body: form });
                        const json = await res.json();
                        if (json && json.success && json.url) {
                            wrapper.querySelector('.media-inner').innerHTML = `<video src="${json.url}" muted autoplay loop playsinline class="portfolio-media portfolio-media-video" style="width:100%;height:100%;object-fit:cover;"></video>`;
                        } else {
                            wrapper.querySelector('.media-inner').innerHTML = '<div style="color:#f88;padding:12px;">Upload failed</div>';
                        }
                    } catch (err) {
                        wrapper.querySelector('.media-inner').innerHTML = '<div style="color:#f88;padding:12px;">Network error</div>';
                    }
                } else {
                    const url = URL.createObjectURL(file);
                    wrapper.querySelector('.media-inner').innerHTML = `<img src="${url}" class="portfolio-media" style="width:100%;height:100%;object-fit:cover;"/>`;
                }
            });
        } else {
            wrapper.innerHTML = (templates[type] || `<p style="color:#e6f6ff;">New ${type}</p>`) +
                `<button onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;background:rgba(193,67,79,0.85);color:#fff;border:none;border-radius:5px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:600;">&#10005; Remove</button>`;
        }

        // Insert into iframe body near end so it's visible in preview
        doc.body.appendChild(wrapper);
        // make accessible and focusable
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', 'Inserted content element');

        // Add toolbar for glow/remove accessible controls
        const tb = doc.createElement('div');
        tb.className = 'ts-dropped-toolbar';
        tb.style.cssText = 'position:absolute;top:-40px;right:8px;display:flex;gap:6px;';
        tb.innerHTML = '<button class="ts-glow-toggle" aria-label="Toggle glow">Glow</button><button class="ts-remove" aria-label="Remove element">Remove</button>';
        wrapper.appendChild(tb);

        const glowBtn = tb.querySelector('.ts-glow-toggle');
        const removeBtn = tb.querySelector('.ts-remove');
        const targetNode = wrapper.querySelector('.portfolio-item') || wrapper.querySelector('.editor-media') || wrapper;

        if (glowBtn) {
            glowBtn.addEventListener('click', () => {
                const had = targetNode.classList.contains('ts-glow');
                if (had) targetNode.classList.remove('ts-glow'); else targetNode.classList.add('ts-glow');
                this.pushAction({ type: 'glow', node: wrapper, prev: !!had });
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.pushAction({ type: 'remove', node: wrapper, parent: doc.body, nextSibling: wrapper.nextSibling });
                wrapper.remove();
            });
        }

        // Keyboard nudging for accessibility
        wrapper.addEventListener('keydown', (e) => {
            const step = e.shiftKey ? 20 : 8;
            let moved = false;
            const curLeft = parseFloat(wrapper.style.left) || 0;
            const curTop = parseFloat(wrapper.style.top) || 0;
            if (e.key === 'ArrowLeft') { wrapper.style.left = (curLeft - step) + 'px'; moved = true; }
            if (e.key === 'ArrowRight') { wrapper.style.left = (curLeft + step) + 'px'; moved = true; }
            if (e.key === 'ArrowUp') { wrapper.style.top = (curTop - step) + 'px'; moved = true; }
            if (e.key === 'ArrowDown') { wrapper.style.top = (curTop + step) + 'px'; moved = true; }
            if (moved) {
                e.preventDefault(); e.stopPropagation();
                this.pushAction({ type: 'move', node: wrapper, prev: { left: curLeft, top: curTop }, next: { left: parseFloat(wrapper.style.left)||0, top: parseFloat(wrapper.style.top)||0 } });
            }
        });

        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.showNotification('Added ' + type + ' element', 'success');
        this.logAction('Added element', type);
    }

    // ── Persist changes to localStorage ───────────────────────────────────
    savePendingChanges() {
        let doc;
        try { doc = this.iframe.contentWindow.document; } catch(e) { return; }

        const changes = {};
        doc.querySelectorAll('[data-ts-changed="true"]').forEach(el => {
            const key = el.id || el.className.split(' ').slice(0, 2).join('.') || el.tagName;
            changes[key] = { innerHTML: el.innerHTML, style: el.getAttribute('style') || '' };
        });

        localStorage.setItem('trident_editor_changes', JSON.stringify(changes));

        const status = document.getElementById('saveStatus');
        if (status) {
            status.classList.add('show');
            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => status.classList.remove('show'), 2000);
        }
    }

    // ── Publish ────────────────────────────────────────────────────────────
    async publish() {
        this.savePendingChanges();
        
        // Get the current HTML from the iframe
        let doc;
        try { 
            doc = this.iframe.contentWindow.document; 
        } catch(e) { 
            this.showNotification('Error accessing preview document', 'error');
            return;
        }

        // Clone document to avoid modifying the live preview
        const docClone = doc.cloneNode(true);

        // Remove editor elements before publishing
        const editorBar = docClone.querySelector('.ts-edit-bar');
        if (editorBar) editorBar.remove();
        
        const editorStyle = docClone.getElementById('ts-editor-styles');
        if (editorStyle) editorStyle.remove();

        // Remove editor classes
        docClone.querySelectorAll('.ts-selectable, .ts-selected').forEach(el => {
            el.classList.remove('ts-selectable', 'ts-selected');
        });

        // Remove ts-changed attributes
        docClone.querySelectorAll('[data-ts-changed]').forEach(el => {
            el.removeAttribute('data-ts-changed');
        });

        // Reset body padding
        if (docClone.body) docClone.body.style.paddingTop = '';

        // Get clean HTML
        const htmlContent = '<!DOCTYPE html>\n' + docClone.documentElement.outerHTML;

        // Publish the page currently selected in the editor.
        const filename = this.currentPage;

        this.showNotification('Publishing changes...', 'info');

        try {
            const roles = this.getUserRoles(this.currentUser);
            const response = await fetch('/api/publish.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename,
                    html_content: htmlContent,
                    user_email: this.currentUser.email,
                    user_role: roles.includes('admin') ? 'admin' : 'website-editor'
                })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('trident_page_published', new Date().toISOString());
                this.logAction('Published changes', `Website updated: ${filename}`);
                this.showNotification('✓ Changes published successfully! Reloading...', 'success');
                setTimeout(() => { 
                    // Reload the page fully to show published changes
                    window.location.reload(); 
                }, 1600);
            } else {
                this.showNotification('Publish failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Publish error:', error);
            this.showNotification('Network error. Changes saved locally only.', 'error');
            // Fallback to local storage
            localStorage.setItem('trident_page_published', new Date().toISOString());
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    logAction(action, details) {
        let logs = JSON.parse(localStorage.getItem('trident_audit_logs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), user: this.currentUser.email, action, details });
        localStorage.setItem('trident_audit_logs', JSON.stringify(logs));
    }

    showNotification(message, type = 'info') {
        const n = document.getElementById('notification');
        if (!n) return;
        n.textContent = message;
        n.className = `notification notification-${type} show`;
        setTimeout(() => n.classList.remove('show'), 3000);
    }

    // Simple undo/redo stack for placed elements
    pushAction(action) {
        try {
            this.undoStack.push(action);
            // clear redo on new action
            this.redoStack.length = 0;
        } catch (e) { console.warn('pushAction failed', e); }
    }

    undo() {
        const a = this.undoStack.pop();
        if (!a) return;
        try {
            const doc = this.iframe.contentWindow.document;
            if (a.type === 'add') {
                if (a.node && a.node.parentNode) {
                    a.node.parentNode.removeChild(a.node);
                }
            } else if (a.type === 'remove') {
                if (a.parent) a.parent.insertBefore(a.node, a.nextSibling || null);
            } else if (a.type === 'move') {
                if (a.node) {
                    a.node.style.left = (a.prev.left || 0) + 'px';
                    a.node.style.top = (a.prev.top || 0) + 'px';
                }
            } else if (a.type === 'glow') {
                if (a.node) {
                    const t = a.node.querySelector('.portfolio-item') || a.node.querySelector('.editor-media') || a.node.querySelector('div');
                    if (t) {
                        if (a.prev) t.classList.add('ts-glow'); else t.classList.remove('ts-glow');
                    }
                }
            }
            this.redoStack.push(a);
        } catch (e) { console.warn('undo failed', e); }
    }

    redo() {
        const a = this.redoStack.pop();
        if (!a) return;
        try {
            if (a.type === 'add') {
                if (a.node) {
                    const doc = this.iframe.contentWindow.document;
                    doc.body.appendChild(a.node);
                }
            } else if (a.type === 'remove') {
                if (a.node && a.node.parentNode) a.node.remove();
            } else if (a.type === 'move') {
                if (a.node) {
                    a.node.style.left = (a.next.left || 0) + 'px';
                    a.node.style.top = (a.next.top || 0) + 'px';
                }
            } else if (a.type === 'glow') {
                const t = a.node.querySelector('.portfolio-item') || a.node.querySelector('.editor-media') || a.node.querySelector('div');
                if (t) {
                    if (!a.prev) t.classList.add('ts-glow'); else t.classList.remove('ts-glow');
                }
            }
            this.undoStack.push(a);
        } catch (e) { console.warn('redo failed', e); }
    }

    // Backward compat stubs
    loadElements()   { return []; }
    renderElements() {}
    saveElements()   {}
}

document.addEventListener('DOMContentLoaded', () => { new WebsiteEditor(); });
