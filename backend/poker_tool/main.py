"""
Main entry point for Poker Tool backend.
"""
from .app import PokerToolApp


if __name__ == "__main__":
    app = PokerToolApp()
    app.run(host="0.0.0.0", port=8000, debug=True)
