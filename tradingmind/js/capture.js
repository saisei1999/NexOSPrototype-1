// Capture.js - Quick capture functionality for NexOS

class CaptureManager {
    constructor() {
        this.captureInput = document.getElementById('capture-input');
        this.sendButton = document.getElementById('send-button');
        this.tickerPreview = document.getElementById('ticker-preview');
        this.saveIndicator = document.getElementById('save-indicator');
        this.capturesContainer = document.getElementById('captures-container');
        
        // Edit mode elements
        this.editIndicator = document.getElementById('edit-indicator');
        this.editActions = document.getElementById('edit-actions');
        this.saveEditBtn = document.getElementById('save-edit-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        // Category elements
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.selectedCategory = null;
        
        // Dropdown elements
        this.dropdownArrow = document.getElementById('idea-dropdown-arrow');
        this.timeframeDropdown = document.getElementById('timeframe-dropdown');
        this.dropdownOptions = document.querySelectorAll('.dropdown-option');
        this.selectedTimeframe = null;
        this.isDropdownOpen = false;
        this.dropdownDebounceTimeout = null;
        
        this.saveTimeout = null;
        this.isEditMode = false;
        this.editingCaptureId = null;
        this.originalText = '';
        this.originalCategory = null;
        this.originalTimeframe = null;
        
        this.init();
        this.initStockModal();
    }

    init() {
        // Load existing captures
        this.loadCaptures();
        
        // Set up event listeners
        this.captureInput.addEventListener('input', (e) => this.handleInput(e));
        this.captureInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Send button event listener
        this.sendButton.addEventListener('click', () => this.commitCapture());
        
        // Edit mode event listeners
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        
        // Category selection event listeners
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCategory(e.target.dataset.category));
        });
        
        // Dropdown event listeners
        if (this.dropdownArrow) {
            this.dropdownArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Debounce to prevent jankiness
                if (this.dropdownDebounceTimeout) {
                    clearTimeout(this.dropdownDebounceTimeout);
                }
                
                this.dropdownDebounceTimeout = setTimeout(() => {
                    console.log('Dropdown arrow clicked'); // Debug log
                    this.toggleDropdown();
                }, 100);
            });
        }
        
        this.dropdownOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTimeframe(e.target.dataset.timeframe);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.category-dropdown-container')) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
        
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

    // Handle input changes - only save drafts, no auto-commit
    handleInput(event) {
        const text = event.target.value;
        const tickers = this.extractTickers(text);
        
        // Update ticker preview
        this.updateTickerPreview(tickers);
        
        // Update send button state
        this.updateSendButton(text);
        
        // Clear existing timeout
        clearTimeout(this.saveTimeout);
        
        // Save draft to localStorage with debouncing
        this.saveTimeout = setTimeout(() => {
            this.saveDraft(text);
            if (text.trim()) {
                this.showSaveIndicator('Draft saved');
            }
        }, 300);
    }

    // Handle keyboard shortcuts
    handleKeydown(event) {
        if (this.isEditMode) {
            // Edit mode shortcuts
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.saveEdit();
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelEdit();
            }
        } else {
            // Normal mode shortcuts
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                this.commitCapture();
            }
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
    
    // Select category
    selectCategory(category) {
        // Remove selected class from all buttons
        this.categoryButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        const selectedBtn = document.querySelector(`[data-category="${category}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            this.selectedCategory = category;
        }
        
        // Handle Idea category dropdown
        if (category === 'idea') {
            this.showDropdownArrow();
            this.updateIdeaButtonText();
        } else {
            this.hideDropdownArrow();
            this.closeDropdown();
            this.resetTimeframeSelection();
        }
        
        // Update send button state
        this.updateSendButton(this.captureInput.value);
    }
    
    // Reset category selection
    resetCategorySelection() {
        this.categoryButtons.forEach(btn => btn.classList.remove('selected'));
        this.selectedCategory = null;
        this.hideDropdownArrow();
        this.closeDropdown();
        this.resetTimeframeSelection();
    }
    
    // Show dropdown arrow
    showDropdownArrow() {
        this.dropdownArrow.style.display = 'inline';
    }
    
    // Hide dropdown arrow
    hideDropdownArrow() {
        this.dropdownArrow.style.display = 'none';
    }
    
    // Toggle dropdown menu
    toggleDropdown() {
        console.log('Toggle dropdown called, isOpen:', this.isDropdownOpen); // Debug log
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    // Open dropdown menu
    openDropdown() {
        console.log('Opening dropdown, element:', this.timeframeDropdown); // Debug log
        if (this.timeframeDropdown) {
            this.timeframeDropdown.classList.add('show');
            this.isDropdownOpen = true;
            this.updateDropdownSelection();
        }
    }
    
    // Close dropdown menu
    closeDropdown() {
        this.timeframeDropdown.classList.remove('show');
        this.isDropdownOpen = false;
    }
    
    // Update dropdown selection highlighting
    updateDropdownSelection() {
        this.dropdownOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.timeframe === this.selectedTimeframe) {
                option.classList.add('selected');
            }
        });
    }
    
    // Select timeframe from dropdown
    selectTimeframe(timeframe) {
        // If already selected, deselect it
        if (this.selectedTimeframe === timeframe) {
            this.selectedTimeframe = null;
        } else {
            this.selectedTimeframe = timeframe;
        }
        
        this.updateIdeaButtonText();
        this.updateDropdownSelection();
        this.closeDropdown();
    }
    
    // Update Idea button text based on selection
    updateIdeaButtonText() {
        const ideaBtn = document.querySelector('[data-category="idea"] .category-text');
        if (ideaBtn) {
            if (this.selectedTimeframe) {
                ideaBtn.textContent = `Idea - ${this.selectedTimeframe.charAt(0).toUpperCase() + this.selectedTimeframe.slice(1)}`;
            } else {
                ideaBtn.textContent = 'Idea';
            }
        }
    }
    
    // Reset timeframe selection
    resetTimeframeSelection() {
        this.selectedTimeframe = null;
        this.updateIdeaButtonText();
        this.updateDropdownSelection();
    }
    
    // Update send button state
    updateSendButton(text) {
        const hasText = text.trim().length > 0;
        const hasCategory = this.selectedCategory !== null;
        const canSend = hasText && hasCategory;
        
        this.sendButton.disabled = !canSend;
        this.sendButton.style.opacity = canSend ? '0.7' : '0.3';
    }
    
    // Commit capture (messaging style)
    async commitCapture() {
        const text = this.captureInput.value.trim();
        if (!text || !this.selectedCategory) return;
        
        const tickers = this.extractTickers(text);
        
        try {
            const capture = {
                id: Date.now(),
                text: text,
                tickers: tickers,
                category: this.selectedCategory,
                timeframe: this.selectedTimeframe, // null for non-idea categories
                timestamp: new Date().toISOString(),
                processed: false
            };
            
            await captureStorage.save(capture);
            
            // Clear input and reset
            this.captureInput.value = '';
            this.tickerPreview.textContent = '';
            this.resetCategorySelection();
            this.hideTimeframeDropdown();
            this.resetTimeframeSelection();
            this.updateSendButton('');
            this.clearDraft();
            
            // Show success indicator
            this.showSaveIndicator('Sent');
            
            // Reload captures list
            this.loadCaptures();
            
            // Focus back on input
            this.captureInput.focus();
        } catch (error) {
            console.error('Failed to commit capture:', error);
        }
    }



    // Show save indicator briefly
    showSaveIndicator(message = 'Saved') {
        this.saveIndicator.textContent = message;
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
        
        this.capturesContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCapture(e.target.closest('button').dataset.id);
            });
        });
        
        // Add event listeners to ticker tags
        this.capturesContainer.querySelectorAll('.ticker-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticker = tag.textContent.replace('$', '');
                this.showStockModal(ticker);
            });
        });
    }

    // Create HTML for a single capture
    createCaptureHTML(capture) {
        const timeAgo = this.getRelativeTime(new Date(capture.timestamp));
        const tickersHTML = capture.tickers.map(t => `<span class="ticker-tag">$${t}</span>`).join('');
        
        // Create enhanced category badge with timeframe
        let categoryBadge = '';
        if (capture.category) {
            let badgeText = capture.category.toUpperCase();
            if (capture.timeframe && capture.category === 'idea') {
                badgeText += ` - ${capture.timeframe.toUpperCase()}`;
            }
            categoryBadge = `<div class="category-badge ${capture.category}">${badgeText}</div>`;
        }
        
        return `
            <div class="capture-card" data-capture-id="${capture.id}">
                <div class="capture-actions">
                    <button class="action-btn edit-btn" data-id="${capture.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${capture.id}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="capture-content">
                    ${categoryBadge}
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

    // Delete capture with confirmation
    async deleteCapture(captureId) {
        if (!confirm('Are you sure you want to delete this capture?')) return;
        
        try {
            await captureStorage.delete(parseInt(captureId));
            this.loadCaptures();
            this.showSaveIndicator('Deleted');
        } catch (error) {
            console.error('Failed to delete capture:', error);
        }
    }
    
    // Initialize stock modal
    initStockModal() {
        const modalOverlay = document.getElementById('stock-modal-overlay');
        const modalClose = document.getElementById('modal-close');
        
        // Close modal on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hideStockModal();
            }
        });
        
        // Close modal on close button click
        modalClose.addEventListener('click', () => {
            this.hideStockModal();
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display !== 'none') {
                this.hideStockModal();
            }
        });
    }
    
    // Show stock modal with mock data
    showStockModal(ticker) {
        const mockData = this.getMockStockData(ticker);
        
        // Update modal content
        document.getElementById('modal-stock-symbol').textContent = `$${ticker}`;
        document.getElementById('modal-price').textContent = `$${mockData.price}`;
        
        const changeElement = document.getElementById('modal-change');
        const changeText = `${mockData.change >= 0 ? '+' : ''}${mockData.change} (${mockData.changePercent >= 0 ? '+' : ''}${mockData.changePercent}%)`;
        changeElement.textContent = changeText;
        changeElement.className = `price-change ${mockData.change >= 0 ? '' : 'negative'}`;
        
        document.getElementById('modal-volume').textContent = mockData.volume;
        document.getElementById('modal-market-cap').textContent = mockData.marketCap;
        
        // Show modal
        document.getElementById('stock-modal-overlay').style.display = 'flex';
    }
    
    // Hide stock modal
    hideStockModal() {
        document.getElementById('stock-modal-overlay').style.display = 'none';
    }
    
    // Get mock stock data
    getMockStockData(ticker) {
        const mockData = {
            AAPL: { price: 185.25, change: 2.15, changePercent: 1.17, volume: '45.2M', marketCap: '2.85T' },
            NVDA: { price: 495.80, change: -8.45, changePercent: -1.68, volume: '28.7M', marketCap: '1.22T' },
            TSLA: { price: 248.50, change: 12.30, changePercent: 5.21, volume: '52.1M', marketCap: '789B' },
            MSFT: { price: 378.85, change: -2.45, changePercent: -0.64, volume: '23.4M', marketCap: '2.81T' },
            GOOGL: { price: 142.65, change: 1.85, changePercent: 1.31, volume: '18.9M', marketCap: '1.78T' },
            AMZN: { price: 151.94, change: -0.78, changePercent: -0.51, volume: '31.2M', marketCap: '1.58T' },
            META: { price: 325.12, change: 4.67, changePercent: 1.46, volume: '19.8M', marketCap: '825B' },
            SPY: { price: 445.23, change: 1.12, changePercent: 0.25, volume: '67.8M', marketCap: 'ETF' },
            QQQ: { price: 385.67, change: -2.34, changePercent: -0.60, volume: '41.5M', marketCap: 'ETF' }
        };
        
        return mockData[ticker] || {
            price: (Math.random() * 200 + 50).toFixed(2),
            change: (Math.random() * 10 - 5).toFixed(2),
            changePercent: (Math.random() * 5 - 2.5).toFixed(2),
            volume: (Math.random() * 50 + 10).toFixed(1) + 'M',
            marketCap: (Math.random() * 2000 + 100).toFixed(0) + 'B'
        };
    }

    // Save draft to localStorage
    saveDraft(text) {
        storage.saveToLocal('capture_draft', { 
            text, 
            category: this.selectedCategory,
            timeframe: this.selectedTimeframe,
            timestamp: Date.now() 
        });
    }

    // Load draft from localStorage
    loadDraft() {
        const draft = storage.getFromLocal('capture_draft');
        if (draft && draft.text) {
            this.captureInput.value = draft.text;
            const tickers = this.extractTickers(draft.text);
            this.updateTickerPreview(tickers);
            
            // Restore category selection
            if (draft.category) {
                this.selectCategory(draft.category);
                
                // Restore timeframe selection if it exists
                if (draft.timeframe && draft.category === 'idea') {
                    this.selectTimeframe(draft.timeframe);
                }
            }
        }
    }

    // Clear draft
    clearDraft() {
        storage.removeFromLocal('capture_draft');
    }

    // Enable edit mode - load capture into main input area
    async enableEditMode(captureId) {
        try {
            const capture = await storage.get('captures', parseInt(captureId));
            if (!capture) return;
            
            // Set edit mode state
            this.isEditMode = true;
            this.editingCaptureId = captureId;
            this.originalText = capture.text;
            this.originalCategory = capture.category;
            this.originalTimeframe = capture.timeframe;
            
            // Load text into input
            this.captureInput.value = capture.text;
            this.updateTickerPreview(capture.tickers);
            
            // Set category selection
            if (capture.category) {
                this.selectCategory(capture.category);
                
                // Set timeframe selection if it exists
                if (capture.timeframe && capture.category === 'idea') {
                    this.selectTimeframe(capture.timeframe);
                }
            }
            
            // Show edit UI
            this.editIndicator.style.display = 'flex';
            this.editActions.style.display = 'flex';
            
            // Focus and select text
            this.captureInput.focus();
            this.captureInput.select();
            
        } catch (error) {
            console.error('Failed to enable edit mode:', error);
        }
    }
    
    // Save edited capture
    async saveEdit() {
        if (!this.isEditMode) return;
        
        const newText = this.captureInput.value.trim();
        if (newText === this.originalText.trim()) {
            this.cancelEdit();
            return;
        }
        
        try {
            const capture = await storage.get('captures', parseInt(this.editingCaptureId));
            if (capture) {
                capture.text = newText;
                capture.tickers = this.extractTickers(newText);
                capture.category = this.selectedCategory;
                capture.timeframe = this.selectedTimeframe;
                capture.updatedAt = new Date().toISOString();
                
                await captureStorage.save(capture);
                this.exitEditMode();
                this.loadCaptures();
                this.showSaveIndicator('Updated');
            }
        } catch (error) {
            console.error('Failed to save edit:', error);
            this.cancelEdit();
        }
    }
    
    // Cancel edit mode
    cancelEdit() {
        if (!this.isEditMode) return;
        
        // Restore original text
        this.captureInput.value = this.originalText;
        this.updateTickerPreview(this.extractTickers(this.originalText));
        
        // Restore original category
        if (this.originalCategory) {
            this.selectCategory(this.originalCategory);
            
            // Restore original timeframe if it exists
            if (this.originalTimeframe && this.originalCategory === 'idea') {
                this.selectTimeframe(this.originalTimeframe);
            } else {
                this.resetTimeframeSelection();
            }
        } else {
            this.resetCategorySelection();
            this.resetTimeframeSelection();
        }
        
        this.exitEditMode();
    }
    
    // Exit edit mode
    exitEditMode() {
        this.isEditMode = false;
        this.editingCaptureId = null;
        this.originalText = '';
        this.originalCategory = null;
        this.originalTimeframe = null;
        
        // Hide edit UI
        this.editIndicator.style.display = 'none';
        this.editActions.style.display = 'none';
        
        // Clear input and reset category/timeframe
        this.captureInput.value = '';
        this.tickerPreview.textContent = '';
        this.resetCategorySelection();
        this.hideTimeframeDropdown();
        this.resetTimeframeSelection();
        this.updateSendButton('');
        
        // Load draft if exists
        this.loadDraft();
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
