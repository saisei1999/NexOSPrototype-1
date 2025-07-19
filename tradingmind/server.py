#!/usr/bin/env python3
"""
Simple HTTP server for NexOS Stock Market Research app
Serves files with proper MIME types and CORS headers
"""

import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Prevent caching during development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        # Ensure proper MIME types
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html'
        return super().guess_type(path)

if __name__ == '__main__':
    # Change to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Debug: Print current directory and files
    print(f"📁 Serving from: {os.getcwd()}")
    print(f"📄 Files in directory: {os.listdir('.')}")
    
    # Check if index.html exists and show first few lines
    if os.path.exists('index.html'):
        with open('index.html', 'r', encoding='utf-8') as f:
            first_lines = f.readlines()[:10]
            print(f"📋 First few lines of index.html:")
            for i, line in enumerate(first_lines, 1):
                print(f"  {i}: {line.strip()}")
    else:
        print("❌ index.html not found!")
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 NexOS server running at http://localhost:{PORT}")
        print("📝 Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
