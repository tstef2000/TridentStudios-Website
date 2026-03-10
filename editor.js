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

        this.initEditorControls();
        this.iframe.addEventListener('load', () => this.initIframeEditing());
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

        if (!doc.querySelector('.ts-edit-bar')) {
            const bar = doc.createElement('div');
            bar.className = 'ts-edit-bar';
            bar.innerHTML = `
                <span style="font-weight:600;">&#9998; Trident Studios Editor</span>
                <span class="ts-edit-bar-badge">EDIT MODE</span>
                <span style="opacity:0.5; font-size:12px;">— Click any text to select &amp; edit</span>
            `;
            doc.body.insertBefore(bar, doc.body.firstChild);
            doc.body.style.paddingTop = '38px';
        }

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
                <label>Link URL</label>
                <input type="text" id="elHrefInput" value="${el.getAttribute('href') || ''}"
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
            hrefInput.addEventListener('input', e => {
                el.href = e.target.value;
                el.dataset.tsChanged = 'true';
                this.savePendingChanges();
            });
        }
    }

    // ── Wire up all editor controls ────────────────────────────────────────
    initEditorControls() {
        document.getElementById('previewBtn').addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'flex';
            this.logAction('Previewed website', 'Full preview opened');
        });

        document.getElementById('closePreviewBtn').addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'none';
        });

        document.getElementById('publishBtn').addEventListener('click', () => this.publish());

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
        });
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

        wrapper.innerHTML = (templates[type] || `<p style="color:#e6f6ff;">New ${type}</p>`) +
            `<button onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;background:rgba(193,67,79,0.85);color:#fff;border:none;border-radius:5px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:600;">&#10005; Remove</button>`;

        const insertAfter = doc.querySelector('section') || doc.querySelector('nav') || doc.body;
        if (insertAfter.after) {
            insertAfter.after(wrapper);
        } else {
            insertAfter.parentNode.insertBefore(wrapper, insertAfter.nextSibling);
        }
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

        // Determine filename (currently editing index.html)
        const filename = 'index.html'; // TODO: Make this dynamic based on what page is being edited

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

    // Backward compat stubs
    loadElements()   { return []; }
    renderElements() {}
    saveElements()   {}
}

document.addEventListener('DOMContentLoaded', () => { new WebsiteEditor(); });
