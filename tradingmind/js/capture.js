// Capture.js - Quick capture functionality for TradingMind

class CaptureManager {
    constructor() {
        this.captureInput = document.getElementById('capture-input');
        this.tickerPreview = document.getElementById('ticker-preview');
        this.saveIndicator = document.getElementById('save-indicator');
        this.capturesContainer = document.getElementById('captures-container');
        
        this.saveTimeout = null;
        this.currentCapture = null;
        
        this.init();
    }

    init() {
        // Load existing captures
        this.loadCaptures();
        
        // Set up event listeners
        this.captureInput.addEventListener('input', (e) => this.handleInput(e));
        this.captureInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Load draft from localStorage
        this.loadDraft();
    }

    // Extract stock tickers from text
    extractTickers(text) {
        const tickerRegex = /\$[A-Z]{1,5}/g;
        const matches = text.match(tickerRegex) || [];
        // Remove $ and deduplicate
        return [...new Set(matches.map(t => t.slice(1)))];
    }

    // Handle input changes with debounced auto-save
    handleInput(event) {
        const text = event.target.value;
        const tickers = this.extractTickers(text);
        
        // Update ticker preview
        this.updateTickerPreview(tickers);
        
        // Clear existing timeout
        clearTimeout(this.saveTimeout);
        
        // Save draft immediately to localStorage
        this.saveDraft(text);
        
        // Debounce auto-save to IndexedDB
        if (text.trim()) {
            this.saveTimeout = setTimeout(() => {
                this.autoSave(text, tickers);
            }, 500);
        }
    }

    // Handle keyboard shortcuts
    handleKeydown(event) {
        // Cmd/Ctrl + Enter to save and clear
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            this.saveAndClear();
        }
    }

    // Update ticker preview display
    updateTickerPreview(tickers) {
        if (tickers.length > 0) {
            this.tickerPreview.textContent = `Tickers: ${tickers.map(t => '$' + t).join(', ')}`;
        } else {
            this.tickerPreview.textContent = '';
        }
    }

    // Auto-save capture
    async autoSave(text, tickers) {
        try {
            // If we have a current capture, update it; otherwise create new
            const capture = {
                id: this.currentCapture?.id || Date.now(),
                text: text,
                tickers: tickers,
                timestamp: this.currentCapture?.timestamp || new Date().toISOString(),
                processed: false
            };
            
            await captureStorage.save(capture);
            this.currentCapture = capture;
            
            // Show save indicator
            this.showSaveIndicator();
            
            // Reload captures list
            this.loadCaptures();
        } catch (error) {
            console.error('Failed to auto-save capture:', error);
        }
    }

    // Save and clear (Cmd+Enter)
    async saveAndClear() {
        const text = this.captureInput.value.trim();
        if (!text) return;
        
        const tickers = this.extractTickers(text);
        
        try {
            const capture = {
                id: Date.now(),
                text: text,
                tickers: tickers,
                timestamp: new Date().toISOString(),
                processed: false
            };
            
            await captureStorage.save(capture);
            
            // Clear input and reset
            this.captureInput.value = '';
            this.tickerPreview.textContent = '';
            this.currentCapture = null;
            this.clearDraft();
            
            // Show save indicator
            this.showSaveIndicator();
            
            // Reload captures list
            this.loadCaptures();
            
            // Focus back on input
            this.captureInput.focus();
        } catch (error) {
            console.error('Failed to save capture:', error);
        }
    }

    // Show save indicator briefly
    showSaveIndicator() {
        this.saveIndicator.classList.add('show');
        setTimeout(() => {
            this.saveIndicator.classList.remove('show');
        }, 2000);
    }

    // Load and display captures
    async loadCaptures() {
        try {
            const captures = await captureStorage.getAll();
            this.displayCaptures(captures);
        } catch (error) {
            console.error('Failed to load captures:', error);
            this.capturesContainer.innerHTML = '<div class="empty-state">Failed to load captures</div>';
        }
    }

    // Display captures in the UI
    displayCaptures(captures) {
        if (captures.length === 0) {
            this.capturesContainer.innerHTML = '<div class="empty-state">No captures yet. Start typing above!</div>';
            return;
        }
        
        this.capturesContainer.innerHTML = captures.map(capture => this.createCaptureHTML(capture)).join('');
        
        // Add event listeners to buttons
        this.capturesContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.enableEditMode(e.target.closest('button').dataset.id);
            });
        });
        
        this.capturesContainer.querySelectorAll('.thread-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.processCapture(e.target.closest('button').dataset.id);
            });
        });
    }

    // Create HTML for a single capture
    createCaptureHTML(capture) {
        const timeAgo = this.getRelativeTime(new Date(capture.timestamp));
        const tickersHTML = capture.tickers.map(t => `<span class="ticker-tag">$${t}</span>`).join('');
        
        return `
            <div class="capture-card" data-capture-id="${capture.id}">
                <div class="capture-actions">
                    <button class="action-btn edit-btn" data-id="${capture.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn thread-btn" data-id="${capture.id}" title="Add to thread">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="capture-content">
                    <p class="capture-text">${this.escapeHtml(capture.text)}</p>
                    <div class="capture-metadata">
                        <span class="timestamp">${timeAgo}</span>
                        ${tickersHTML ? `<div class="ticker-tags">${tickersHTML}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Process capture (move to notes)
    async processCapture(captureId) {
        try {
            const capture = await storage.get('captures', parseInt(captureId));
            if (!capture) return;
            
            // Create a new note from capture
            const note = {
                title: `Note from capture - ${new Date().toLocaleDateString()}`,
                content: capture.text,
                tickers: capture.tickers,
                articleRefs: [],
                tags: ['from-capture'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await noteStorage.save(note);
            
            // Mark capture as processed
            await captureStorage.markProcessed(parseInt(captureId));
            
            // Reload captures
            this.loadCaptures();
            
            // Show success message
            this.showSaveIndicator();
        } catch (error) {
            console.error('Failed to process capture:', error);
        }
    }

    // Delete capture
    async deleteCapture(captureId) {
        if (!confirm('Delete this capture?')) return;
        
        try {
            await captureStorage.delete(parseInt(captureId));
            this.loadCaptures();
        } catch (error) {
            console.error('Failed to delete capture:', error);
        }
    }

    // Save draft to localStorage
    saveDraft(text) {
        storage.saveToLocal('capture_draft', { text, timestamp: Date.now() });
    }

    // Load draft from localStorage
    loadDraft() {
        const draft = storage.getFromLocal('capture_draft');
        if (draft && draft.text) {
            this.captureInput.value = draft.text;
            const tickers = this.extractTickers(draft.text);
            this.updateTickerPreview(tickers);
        }
    }

    // Clear draft
    clearDraft() {
        storage.removeFromLocal('capture_draft');
    }

    // Enable edit mode for a capture
    enableEditMode(captureId) {
        const card = document.querySelector(`[data-capture-id="${captureId}"]`);
        if (!card) return;
        
        const textElement = card.querySelector('.capture-text');
        const currentText = textElement.textContent;
        
        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.className = 'capture-edit-textarea';
        textarea.style.height = Math.max(textElement.offsetHeight, 40) + 'px';
        
        // Replace text with textarea
        textElement.replaceWith(textarea);
        textarea.focus();
        textarea.select();
        
        // Auto-resize as user types
        textarea.addEventListener('input', () => this.autoResize(textarea));
        
        // Save on blur or Ctrl+Enter
        textarea.addEventListener('blur', () => this.saveEdit(captureId, textarea.value, currentText));
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.saveEdit(captureId, textarea.value, currentText);
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(captureId, currentText, textarea);
            }
        });
    }
    
    // Auto-resize textarea
    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 40) + 'px';
    }
    
    // Save edited capture
    async saveEdit(captureId, newText, originalText) {
        if (newText.trim() === originalText.trim()) {
            this.cancelEdit(captureId, originalText);
            return;
        }
        
        try {
            const capture = await storage.get('captures', parseInt(captureId));
            if (capture) {
                capture.text = newText.trim();
                capture.tickers = this.extractTickers(newText);
                capture.updatedAt = new Date().toISOString();
                
                await captureStorage.save(capture);
                this.loadCaptures();
                this.showSaveIndicator();
            }
        } catch (error) {
            console.error('Failed to save edit:', error);
            this.cancelEdit(captureId, originalText);
        }
    }
    
    // Cancel edit mode
    cancelEdit(captureId, originalText, textarea = null) {
        const card = document.querySelector(`[data-capture-id="${captureId}"]`);
        if (!card) return;
        
        const textareaElement = textarea || card.querySelector('.capture-edit-textarea');
        if (textareaElement) {
            const p = document.createElement('p');
            p.className = 'capture-text';
            p.textContent = originalText;
            textareaElement.replaceWith(p);
        }
    }

    // Utility: Get relative time string (Kortex-style)
    getRelativeTime(date) {
        const now = Date.now();
        const diff = now - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize capture manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.captureManager = new CaptureManager();
});
