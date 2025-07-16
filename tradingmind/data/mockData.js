// Mock data for development and testing

const mockCaptures = [
    {
        id: 1,
        text: "Looking at $NVDA breaking through resistance at 500. RSI showing overbought but momentum still strong. Consider taking partial profits if it hits 520.",
        tickers: ["NVDA"],
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        processed: false
    },
    {
        id: 2,
        text: "$AAPL forming a cup and handle pattern on the daily chart. $MSFT also looking strong. Tech sector rotation might be happening.",
        tickers: ["AAPL", "MSFT"],
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        processed: false
    },
    {
        id: 3,
        text: "Fed minutes released - more hawkish than expected. Watch $SPY and $QQQ for reaction. Might see some profit taking in growth stocks.",
        tickers: ["SPY", "QQQ"],
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        processed: false
    }
];

const mockNotes = [
    {
        id: "note_1",
        title: "NVDA Technical Analysis - Q1 2024",
        content: "NVIDIA has been showing incredible strength despite broader market volatility. Key levels to watch:\n\n• Support: $480, $465\n• Resistance: $520, $535\n\nThe AI narrative continues to drive institutional buying. Data center revenue growth remains the key catalyst.",
        tickers: ["NVDA"],
        articleRefs: [],
        tags: ["technical-analysis", "ai-stocks", "semiconductors"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
    },
    {
        id: "note_2",
        title: "Fed Policy Impact on Tech Stocks",
        content: "Recent Fed communications suggest rates will stay higher for longer. This could impact high-growth tech valuations.\n\nSectors to watch:\n- Profitable tech (AAPL, MSFT) - likely to outperform\n- Unprofitable growth - continued pressure\n- Semiconductors - mixed based on AI demand",
        tickers: ["AAPL", "MSFT", "QQQ"],
        articleRefs: [],
        tags: ["macro", "fed-policy", "sector-rotation"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
    }
];

const mockArticles = [
    {
        id: "art_1",
        url: "https://example.com/nvidia-earnings-preview",
        title: "NVIDIA Earnings Preview: What Wall Street Expects",
        content: "<article><h1>NVIDIA Earnings Preview: What Wall Street Expects</h1><p>As NVIDIA prepares to report earnings...</p></article>",
        plainText: "NVIDIA Earnings Preview: What Wall Street Expects\n\nAs NVIDIA prepares to report earnings...",
        savedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        highlights: [],
        tags: ["earnings", "NVDA"]
    },
    {
        id: "art_2",
        url: "https://example.com/fed-minutes-analysis",
        title: "Fed Minutes Reveal Hawkish Stance on Inflation",
        content: "<article><h1>Fed Minutes Reveal Hawkish Stance on Inflation</h1><p>The latest Federal Reserve minutes show...</p></article>",
        plainText: "Fed Minutes Reveal Hawkish Stance on Inflation\n\nThe latest Federal Reserve minutes show...",
        savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        highlights: [],
        tags: ["fed", "macro", "inflation"]
    }
];

// Function to populate IndexedDB with mock data
async function loadMockData() {
    try {
        // Check if data already exists
        const existingCaptures = await captureStorage.getAll();
        
        if (existingCaptures.length === 0) {
            console.log('Loading mock data...');
            
            // Load captures
            for (const capture of mockCaptures) {
                await captureStorage.save(capture);
            }
            
            // Load notes
            for (const note of mockNotes) {
                await noteStorage.save(note);
            }
            
            // Load articles
            for (const article of mockArticles) {
                await articleStorage.save(article);
            }
            
            console.log('Mock data loaded successfully!');
            
            // Refresh the current view
            if (window.captureManager) {
                window.captureManager.loadCaptures();
            }
        }
    } catch (error) {
        console.error('Failed to load mock data:', error);
    }
}

// Auto-load mock data in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadMockData, 1000); // Give IndexedDB time to initialize
    });
}
