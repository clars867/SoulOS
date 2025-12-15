"""
Lightweight static file server to host the SoulOS page.
Run: python3 server.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PORT = 8000


class SoulOSHandler(http.server.SimpleHTTPRequestHandler):
    """Serve files from the repository root."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SoulOSHandler) as httpd:
        print(f"SoulOS server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")


if __name__ == "__main__":
    main()
