// Storage.js - Data persistence layer for NexOS

class Storage {
    constructor() {
        this.dbName = 'NexOSDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
    }

    // Initialize IndexedDB
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('captures')) {
                    const captureStore = db.createObjectStore('captures', { keyPath: 'id' });
                    captureStore.createIndex('timestamp', 'timestamp', { unique: false });
                    captureStore.createIndex('processed', 'processed', { unique: false });
                }

                if (!db.objectStoreNames.contains('notes')) {
                    const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
                    noteStore.createIndex('createdAt', 'createdAt', { unique: false });
                    noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('articles')) {
                    const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
                    articleStore.createIndex('savedAt', 'savedAt', { unique: false });
                    articleStore.createIndex('url', 'url', { unique: true });
                }

                if (!db.objectStoreNames.contains('highlights')) {
                    const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' });
                    highlightStore.createIndex('articleId', 'articleId', { unique: false });
                    highlightStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // Generic CRUD operations
    async save(storeName, data) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.getAll(query) : source.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async ensureDB() {
        if (!this.db) {
            await this.initDB();
        }
    }

    // LocalStorage fallback for simple data
    saveToLocal(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    }

    getFromLocal(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to get from localStorage:', e);
            return null;
        }
    }

    removeFromLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Failed to remove from localStorage:', e);
            return false;
        }
    }
}

// Create global storage instance
const storage = new Storage();

// Capture-specific storage methods
const captureStorage = {
    async save(capture) {
        capture.id = capture.id || Date.now();
        capture.timestamp = capture.timestamp || new Date().toISOString();
        capture.processed = capture.processed || false;
        return await storage.save('captures', capture);
    },

    async getAll(onlyUnprocessed = false) {
        const captures = await storage.getAll('captures');
        if (onlyUnprocessed) {
            return captures.filter(c => !c.processed);
        }
        return captures.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    async delete(id) {
        return await storage.delete('captures', id);
    },

    async markProcessed(id) {
        const capture = await storage.get('captures', id);
        if (capture) {
            capture.processed = true;
            return await storage.save('captures', capture);
        }
    }
};

// Note-specific storage methods
const noteStorage = {
    async save(note) {
        note.id = note.id || 'note_' + Date.now();
        note.createdAt = note.createdAt || new Date().toISOString();
        note.updatedAt = new Date().toISOString();
        return await storage.save('notes', note);
    },

    async getAll() {
        const notes = await storage.getAll('notes');
        return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    async delete(id) {
        return await storage.delete('notes', id);
    }
};

// Article-specific storage methods
const articleStorage = {
    async save(article) {
        article.id = article.id || 'art_' + Date.now();
        article.savedAt = article.savedAt || new Date().toISOString();
        return await storage.save('articles', article);
    },

    async getAll() {
        const articles = await storage.getAll('articles');
        return articles.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    },

    async getByUrl(url) {
        const articles = await storage.getAll('articles', 'url', url);
        return articles[0] || null;
    },

    async delete(id) {
        return await storage.delete('articles', id);
    }
};

// Export for use in other modules
window.storage = storage;
window.captureStorage = captureStorage;
window.noteStorage = noteStorage;
window.articleStorage = articleStorage;
