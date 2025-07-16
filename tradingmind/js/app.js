// App.js - Main application logic for TradingMind

class App {
    constructor() {
        this.currentView = 'inbox';
        this.init();
    }

    init() {
        // Set up sidebar navigation
        this.setupSidebarNavigation();
        
        // Initialize collapsible sections
        this.setupCollapsibleSections();
        
        // Initialize view initializers
        this.setupViewInitializers();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Set up search functionality
        this.setupSearch();
    }

    setupSidebarNavigation() {
        const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
        const views = document.querySelectorAll('.view');
        
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetView = item.dataset.tab;
                
                // Update active states
                sidebarItems.forEach(btn => btn.classList.remove('active'));
                views.forEach(view => view.classList.remove('active'));
                
                item.classList.add('active');
                document.getElementById(`${targetView}-view`).classList.add('active');
                
                this.currentView = targetView;
                
                // Trigger view-specific initialization
                this.onViewChange(targetView);
            });
        });
    }

    setupCollapsibleSections() {
        const sections = document.querySelectorAll('.nav-section');
        
        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            if (header) {
                header.addEventListener('click', () => {
                    section.classList.toggle('open');
                });
            }
        });
    }

    setupViewInitializers() {
        // Initialize features for each view
        this.viewInitializers = {
            inbox: () => {
                // Inbox is initialized by capture.js
                if (window.captureManager) {
                    window.captureManager.captureInput.focus();
                }
            },
            notes: () => {
                this.loadNotes();
            },
            reader: () => {
                this.loadArticles();
            }
        };
    }

    onViewChange(view) {
        if (this.viewInitializers[view]) {
            this.viewInitializers[view]();
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }
        
        // ⌘K shortcut for search
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput?.focus();
            }
        });
    }

    performSearch(query) {
        // TODO: Implement search functionality
        console.log('Searching for:', query);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + 1/2/3 for view switching
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchToView('inbox');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchToView('notes');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchToView('reader');
                        break;
                }
            }
        });
    }

    switchToView(viewName) {
        const sidebarItem = document.querySelector(`[data-tab="${viewName}"]`);
        if (sidebarItem) {
            sidebarItem.click();
        }
    }

    // Notes functionality
    async loadNotes() {
        const notesContainer = document.getElementById('notes-container');
        
        try {
            const notes = await noteStorage.getAll();
            
            if (notes.length === 0) {
                notesContainer.innerHTML = '<div class="empty-state">No notes yet. Process captures or create a new note!</div>';
                return;
            }
            
            notesContainer.innerHTML = notes.map(note => this.createNoteHTML(note)).join('');
            
            // Add event listeners
            notesContainer.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-note-btn')) {
                        this.editNote(item.dataset.id);
                    }
                });
            });
            
            notesContainer.querySelectorAll('.delete-note-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this note?')) {
                        await noteStorage.delete(e.target.dataset.id);
                        this.loadNotes();
                    }
                });
            });
        } catch (error) {
            console.error('Failed to load notes:', error);
            notesContainer.innerHTML = '<div class="empty-state">Failed to load notes</div>';
        }
    }

    createNoteHTML(note) {
        const preview = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
        const tickersHTML = note.tickers?.map(t => `<span class="ticker-tag">$${t}</span>`).join('') || '';
        
        return `
            <div class="note-item" data-id="${note.id}" style="
                background-color: var(--bg-secondary);
                border-radius: 8px;
                padding: var(--spacing-md);
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid var(--border);
            ">
                <h3 style="margin-bottom: var(--spacing-sm); color: var(--text-primary);">${this.escapeHtml(note.title)}</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-sm);">${this.escapeHtml(preview)}</p>
                ${tickersHTML ? `<div class="capture-tickers" style="margin-bottom: var(--spacing-sm);">${tickersHTML}</div>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                        ${new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button class="btn-danger delete-note-btn" data-id="${note.id}" style="font-size: var(--font-size-sm);">Delete</button>
                </div>
            </div>
        `;
    }

    editNote(noteId) {
        // TODO: Implement note editor
        alert('Note editor coming soon! Note ID: ' + noteId);
    }

    // Articles functionality
    async loadArticles() {
        const articlesContainer = document.getElementById('articles-container');
        const saveArticleBtn = document.getElementById('save-article-btn');
        const articleUrlInput = document.getElementById('article-url-input');
        
        // Set up save article button
        if (!saveArticleBtn.hasListener) {
            saveArticleBtn.addEventListener('click', () => this.saveArticle());
            articleUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveArticle();
            });
            saveArticleBtn.hasListener = true;
        }
        
        try {
            const articles = await articleStorage.getAll();
            
            if (articles.length === 0) {
                articlesContainer.innerHTML = '<div class="empty-state">No saved articles yet. Paste a URL above to save an article!</div>';
                return;
            }
            
            articlesContainer.innerHTML = articles.map(article => this.createArticleHTML(article)).join('');
            
            // Add event listeners
            articlesContainer.querySelectorAll('.article-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-article-btn')) {
                        this.viewArticle(item.dataset.id);
                    }
                });
            });
            
            articlesContainer.querySelectorAll('.delete-article-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this article?')) {
                        await articleStorage.delete(e.target.dataset.id);
                        this.loadArticles();
                    }
                });
            });
        } catch (error) {
            console.error('Failed to load articles:', error);
            articlesContainer.innerHTML = '<div class="empty-state">Failed to load articles</div>';
        }
    }

    createArticleHTML(article) {
        const domain = new URL(article.url).hostname.replace('www.', '');
        
        return `
            <div class="article-item" data-id="${article.id}" style="
                background-color: var(--bg-secondary);
                border-radius: 8px;
                padding: var(--spacing-md);
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid var(--border);
            ">
                <h3 style="margin-bottom: var(--spacing-sm); color: var(--text-primary);">${this.escapeHtml(article.title)}</h3>
                <p style="color: var(--accent); font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">${domain}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                        ${new Date(article.savedAt).toLocaleDateString()}
                    </span>
                    <button class="btn-danger delete-article-btn" data-id="${article.id}" style="font-size: var(--font-size-sm);">Delete</button>
                </div>
            </div>
        `;
    }

    async saveArticle() {
        const urlInput = document.getElementById('article-url-input');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('Please enter a URL');
            return;
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL');
            return;
        }
        
        // Check if already saved
        const existing = await articleStorage.getByUrl(url);
        if (existing) {
            alert('This article is already saved!');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('save-article-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            // Use CORS proxy to fetch article
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const html = await response.text();
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract title
            const title = doc.querySelector('title')?.textContent || 
                         doc.querySelector('h1')?.textContent || 
                         'Untitled Article';
            
            // Extract content (simplified - in production, use a proper article parser)
            const article = {
                url: url,
                title: title.trim(),
                content: html,
                plainText: doc.body.textContent || '',
                highlights: []
            };
            
            await articleStorage.save(article);
            
            // Clear input and reload
            urlInput.value = '';
            this.loadArticles();
            
            alert('Article saved successfully!');
        } catch (error) {
            console.error('Failed to save article:', error);
            alert('Failed to save article. Please try again.');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    viewArticle(articleId) {
        // TODO: Implement article reader view
        alert('Article reader coming soon! Article ID: ' + articleId);
    }

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Set up new note button
    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
            // TODO: Implement new note creation
            alert('Note editor coming soon!');
        });
    }
});
