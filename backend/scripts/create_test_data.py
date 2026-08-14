#!/usr/bin/env python3
"""Create test data (user + range) for E2E tests.

Run from the backend/ directory:

    python3 scripts/create_test_data.py

Idempotent: re-running won't duplicate existing test data.
"""
import os
import sys

# Ensure the backend directory is importable when run as a script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from poker_tool.app import PokerTool
from poker_tool.objects.range import Range


def main() -> None:
    app = PokerTool()

    with app.app.app_context():
        # Create test user (idempotent).
        user = app.users.user_by_username("testuser")
        if not user:
            user = app.auth.create_user(
                username="testuser",
                email="test@test.com",
                password="password123",
            )
            user = app.users.add(user)
            print(f"User created: ID={user.id}")
        else:
            print(f"User already exists: ID={user.id}")

        # Create test range (idempotent).
        ranges = app.ranges.ranges_by_user(user.id)
        range_obj = next((r for r in ranges if r.name == "Test Range E2E"), None)

        if not range_obj:
            range_obj = Range.from_dict({
                "name": "Test Range E2E",
                "description": "Range de test pour E2E",
                "range_type": "preflop",
                "position": "BTN",
                "hands": {
                    "AA": "raise",
                    "KK": "raise",
                    "QQ": "raise",
                    "AKs": "raise",
                    "JJ": "call",
                    "TT": "call",
                    "AQs": "raise",
                    "KQs": "call",
                },
                "user_id": user.id,
            })
            range_obj = app.ranges.add(range_obj)
            print(f"Range created: ID={range_obj.id}")
        else:
            print(f"Range already exists: ID={range_obj.id}")

        all_ranges = app.ranges.all()
        print(f"Total ranges: {len(all_ranges)}")


if __name__ == "__main__":
    main()
