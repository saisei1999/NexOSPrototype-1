# NexOS - Stock Market Research App

A powerful stock market research app that combines note-taking with article intelligence, featuring quick capture, smart notes, and real-time stock integration.

## Features

### ✅ Implemented (MVP)
- **Quick Capture Inbox**: Instant capture for trading ideas with auto-save
- **Smart Ticker Detection**: Automatically detects stock tickers ($AAPL, $TSLA)
- **Note Organization**: Create and manage notes linked to stock tickers
- **Article Saving**: Save articles from any URL for later reading
- **Dark Theme**: Beautiful dark theme optimized for long research sessions
- **Mobile Responsive**: Works great on all devices
- **Offline Storage**: All data stored locally using IndexedDB

### 🚧 Coming Soon
- Article highlighting and annotations
- Real-time stock price integration
- Advanced search across all content
- Note editor with rich text formatting
- Export functionality

## Getting Started

### Option 1: Python Server (Recommended)
```bash
# Navigate to the nexos directory
cd tradingmind

# Run the server
python3 server.py

# Open http://localhost:8000 in your browser
```

### Option 2: Direct File Access
Simply open `index.html` in your web browser. Note: Some features like article saving may not work due to CORS restrictions.

## Usage Guide

### Quick Capture (Inbox)
1. Start typing in the capture box - it auto-saves as you type
2. Use $TICKER format to tag stocks (e.g., $AAPL, $NVDA)
3. Press Cmd/Ctrl + Enter to save and clear
4. Process captures to convert them into full notes

### Keyboard Shortcuts
- `Cmd/Ctrl + Enter`: Save and clear capture
- `Alt + 1`: Switch to Inbox
- `Alt + 2`: Switch to Notes
- `Alt + 3`: Switch to Reader

### Saving Articles
1. Go to the Reader tab
2. Paste any article URL
3. Click "Save Article"
4. Articles are saved locally for offline reading

## Technical Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: IndexedDB for complex data, LocalStorage for drafts
- **Design**: Mobile-first responsive design with CSS Grid/Flexbox

## Development

### Project Structure
```
nexos/
├── index.html          # Main app interface
├── css/
│   └── styles.css      # Dark theme, mobile-first styles
├── js/
│   ├── app.js          # Main app logic and tab navigation
│   ├── capture.js      # Quick capture functionality
│   ├── storage.js      # Data persistence layer
│   └── reader.js       # (Coming soon) Article reader
├── data/
│   └── mockData.js     # Sample data for development
└── server.py           # Development server
```

### Data Models

#### Capture
```javascript
{
  id: timestamp,
  text: "capture text",
  tickers: ["AAPL", "NVDA"],
  timestamp: "ISO date",
  processed: false
}
```

#### Note
```javascript
{
  id: "note_timestamp",
  title: "Note title",
  content: "Note content",
  tickers: ["AAPL"],
  articleRefs: ["art_123"],
  tags: ["analysis"],
  createdAt: "ISO date",
  updatedAt: "ISO date"
}
```

#### Article
```javascript
{
  id: "art_timestamp",
  url: "https://...",
  title: "Article title",
  content: "HTML content",
  plainText: "Plain text",
  savedAt: "ISO date",
  highlights: []
}
```

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Mobile browsers: Optimized for touch

## Tips for Learning
1. Start by exploring the Quick Capture feature
2. Look at `capture.js` to understand event handling and auto-save
3. Study `storage.js` to learn about IndexedDB
4. Examine `styles.css` for modern CSS techniques

## Future Enhancements
- Stock price API integration (Alpha Vantage, Yahoo Finance)
- Advanced highlighting with text selection API
- Full-text search with Fuse.js
- Export to Markdown/PDF
- Sync across devices
- Chrome extension for quick capture

## License
MIT License - Feel free to use and modify!

---

Built with ❤️ for traders and investors who love taking notes!
