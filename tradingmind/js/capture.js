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
        this.capturesContainer.querySelectorAll('.process-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.processCapture(e.target.dataset.id));
        });
        
        this.capturesContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteCapture(e.target.dataset.id));
        });
    }

    // Create HTML for a single capture
    createCaptureHTML(capture) {
        const timeAgo = this.getTimeAgo(new Date(capture.timestamp));
        const tickersHTML = capture.tickers.map(t => `<span class="ticker-tag">$${t}</span>`).join('');
        
        return `
            <div class="capture-item" data-id="${capture.id}">
                <div class="capture-text">${this.escapeHtml(capture.text)}</div>
                <div class="capture-meta">
                    <div>
                        <span class="capture-time">${timeAgo}</span>
                        ${tickersHTML ? `<div class="capture-tickers">${tickersHTML}</div>` : ''}
                    </div>
                    <div class="capture-actions">
                        <button class="btn-secondary process-btn" data-id="${capture.id}">Process</button>
                        <button class="btn-danger delete-btn" data-id="${capture.id}">Delete</button>
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

    // Utility: Get time ago string
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        
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
