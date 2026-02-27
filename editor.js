// Website Editor Manager
class WebsiteEditor {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('trident_currentUser'));
        
        // Check if user has editor access
        if (!this.currentUser || (this.currentUser.role !== 'website-editor' && this.currentUser.role !== 'admin')) {
            window.location.href = 'dashboard.html';
        }

        this.canvas = document.getElementById('canvasContent');
        this.selectedElement = null;
        this.draggedElement = null;
        this.elements = this.loadElements();
        
        this.initializeEventListeners();
        this.renderElements();
        this.logAction('Opened editor', 'Website editor session started');
    }

    initializeEventListeners() {
        // Draggable elements from sidebar
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        });

        // Canvas drop zone
        this.canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));

        // Preview and Publish buttons
        document.getElementById('previewBtn').addEventListener('click', () => this.preview());
        document.getElementById('publishBtn').addEventListener('click', () => this.publish());
        document.getElementById('closePreviewBtn').addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'none';
        });

        // Style controls
        document.getElementById('fontSizeInput').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            if (this.selectedElement) {
                this.selectedElement.style.fontSize = e.target.value + 'px';
            }
        });

        document.getElementById('bgColorInput').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.style.backgroundColor = e.target.value;
            }
        });

        document.getElementById('textColorInput').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.style.color = e.target.value;
            }
        });

        document.getElementById('paddingInput').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.style.padding = e.target.value + 'px';
            }
        });
    }

    handleDragStart(e) {
        this.draggedElement = e.target.dataset.type;
        e.dataTransfer.effectAllowed = 'copy';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.canvas.style.borderColor = '#2bb3ff';
    }

    handleDrop(e) {
        e.preventDefault();
        this.canvas.style.borderColor = 'transparent';

        if (!this.draggedElement) return;

        const elementId = 'element-' + Date.now();
        const newElement = this.createElement(this.draggedElement, elementId);
        
        this.canvas.appendChild(newElement);
        
        this.elements.push({
            id: elementId,
            type: this.draggedElement,
            content: this.getDefaultContent(this.draggedElement),
            style: {}
        });

        this.saveElements();
        this.logAction('Added element', this.draggedElement);
        this.draggedElement = null;
    }

    createElement(type, id) {
        const element = document.createElement('div');
        element.className = 'editor-element editor-element-' + type;
        element.id = id;
        element.draggable = true;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'element-remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeElement(id);
        });

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });

        element.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.style.opacity = '0.7';
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            element.style.opacity = '1';
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.style.opacity = '1';
        });

        const content = document.createElement('div');
        content.className = 'element-content';
        content.innerHTML = this.getDefaultContent(type);
        content.contentEditable = false;

        element.appendChild(content);
        element.appendChild(removeBtn);

        return element;
    }

    getDefaultContent(type) {
        const defaults = {
            'heading': '<h2>Heading</h2>',
            'paragraph': '<p>Click to edit your text</p>',
            'button': '<button style="background: #2bb3ff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Click Me</button>',
            'image': '<div style="background: #0c3a52; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; color: #2bb3ff;"><i class="fas fa-image" style="font-size: 48px;"></i></div>',
            'section': '<div style="background: #031723; padding: 40px; text-align: center; color: #e6f6ff;">Section Content</div>',
            'card': '<div style="background: #0c3a52; border: 1px solid #0c3a52; padding: 20px; border-radius: 8px;"><h3 style="margin-top: 0;">Card Title</h3><p>Card content goes here</p></div>',
            'form': '<form><input type="text" placeholder="Name" style="display: block; margin: 10px 0; padding: 8px;"><input type="email" placeholder="Email" style="display: block; margin: 10px 0; padding: 8px;"><button type="submit" style="padding: 8px 16px; background: #2bb3ff; color: white; border: none; border-radius: 4px;">Submit</button></form>'
        };
        return defaults[type] || 'Element';
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        this.selectedElement = element;
        element.classList.add('selected');

        this.updatePropertiesPanel(element);
    }

    updatePropertiesPanel(element) {
        const panel = document.getElementById('propertiesPanel');
        const type = element.className.replace('editor-element editor-element-', '');
        
        panel.innerHTML = `
            <div class="property-item">
                <label>Element Type</label>
                <p style="color: #2bb3ff; margin: 5px 0;">${type}</p>
            </div>
            <div class="property-item">
                <label>Content</label>
                <textarea class="content-editor" style="width: 100%; height: 80px; padding: 8px; background: #0c3a52; color: #e6f6ff; border: 1px solid #0c3a52; border-radius: 4px;">${element.querySelector('.element-content').innerHTML}</textarea>
                <button class="btn-small" id="updateContentBtn" style="margin-top: 10px; width: 100%;">Update Content</button>
            </div>
            <div class="property-item">
                <label>Position</label>
                <select style="width: 100%; padding: 8px; background: #0c3a52; color: #e6f6ff; border: 1px solid #0c3a52; border-radius: 4px;">
                    <option>Static</option>
                    <option>Relative</option>
                    <option>Absolute</option>
                </select>
            </div>
        `;

        document.getElementById('updateContentBtn').addEventListener('click', () => {
            const newContent = panel.querySelector('.content-editor').value;
            element.querySelector('.element-content').innerHTML = newContent;
            this.saveElements();
            this.showNotification('Content updated', 'success');
            this.logAction('Edited element content', type);
        });
    }

    removeElement(id) {
        document.getElementById(id).remove();
        this.elements = this.elements.filter(e => e.id !== id);
        this.saveElements();
        this.selectedElement = null;
        document.getElementById('propertiesPanel').innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Select an element to edit</p>';
        this.logAction('Removed element', id);
    }

    renderElements() {
        if (this.canvas.innerHTML.includes('canvas-placeholder')) {
            this.canvas.innerHTML = '';
        }

        this.elements.forEach(elem => {
            const element = this.createElement(elem.type, elem.id);
            if (elem.style) {
                Object.assign(element.style, elem.style);
            }
            this.canvas.appendChild(element);
        });
    }

    saveElements() {
        const elements = Array.from(this.canvas.querySelectorAll('.editor-element')).map(elem => ({
            id: elem.id,
            type: elem.className.replace('editor-element editor-element-', ''),
            content: elem.querySelector('.element-content').innerHTML,
            style: {
                backgroundColor: elem.style.backgroundColor,
                color: elem.style.color,
                fontSize: elem.style.fontSize,
                padding: elem.style.padding
            }
        }));

        localStorage.setItem('trident_page_elements', JSON.stringify(elements));
        this.elements = elements;

        document.getElementById('saveStatus').classList.add('show');
        setTimeout(() => {
            document.getElementById('saveStatus').classList.remove('show');
        }, 2000);
    }

    loadElements() {
        const stored = localStorage.getItem('trident_page_elements');
        return stored ? JSON.parse(stored) : [];
    }

    preview() {
        const modal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');
        
        previewContent.innerHTML = this.canvas.innerHTML;
        
        // Remove editor controls from preview
        previewContent.querySelectorAll('.element-remove-btn').forEach(btn => btn.remove());
        previewContent.querySelectorAll('.editor-element').forEach(elem => {
            elem.style.cursor = 'default';
            elem.classList.remove('selected');
        });

        modal.style.display = 'flex';
        this.logAction('Previewed changes', 'Opened preview');
    }

    publish() {
        if (confirm('Publish changes to live website?')) {
            this.saveElements();
            localStorage.setItem('trident_page_published', new Date().toISOString());
            this.logAction('Published changes', 'Website updated');
            this.showNotification('Website published successfully!', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    logAction(action, details) {
        let logs = JSON.parse(localStorage.getItem('trident_audit_logs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            user: this.currentUser.email,
            action,
            details
        });
        localStorage.setItem('trident_audit_logs', JSON.stringify(logs));
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteEditor();
});
