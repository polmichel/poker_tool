#!/usr/bin/env python3
"""
Main entry point for Poker Tool backend.

This is the primary entry point that uses the new Elegant Objects architecture.
The old app.py is deprecated and will be removed in a future version.

To run the application:
    python backend/main.py

Or using the module syntax:
    python -m backend.main
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the new architecture
from poker_tool.app import PokerTool


def create_app():
    """Create and configure the Poker Tool application."""
    return PokerTool()


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
