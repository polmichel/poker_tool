"""
Donations controller for handling payment-related endpoints.

This controller provides endpoints for creating Stripe checkout sessions
for donations.
"""

import stripe
from flask import Blueprint, jsonify, request

from ....config import Config


class DonationController:
    """Controller for donation-related endpoints."""

    def __init__(self, config: Config):
        """Initialize with configuration."""
        self.config = config
        # Initialize Stripe with the secret key from config
        stripe.api_key = self.config.stripe_secret_key

    def register(self, api: Blueprint) -> None:
        """Register donation routes on the given Flask Blueprint."""
        # Create a dedicated blueprint for donation routes
        donations_bp = Blueprint("donations", __name__, url_prefix="/donations")

        @donations_bp.route("/create-checkout-session", methods=["POST"])
        def create_checkout_session():
            """Create a Stripe checkout session for a donation."""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "Request body is required"}), 400

                amount = data.get("amount")
                currency = data.get("currency", "eur")

                if not amount:
                    return jsonify({"error": "Amount is required"}), 400

                try:
                    amount_float = float(amount)
                    if amount_float <= 0:
                        return jsonify({"error": "Amount must be positive"}), 400
                except (ValueError, TypeError):
                    return jsonify({"error": "Amount must be a valid number"}), 400

                # Convert amount to cents (Stripe uses smallest currency unit)
                amount_cents = round(amount_float * 100)

                # Get origin from headers for success/cancel URLs
                origin = request.headers.get(
                    "Origin", self.config.frontend_url or "http://localhost:3000"
                )

                # Create Stripe checkout session
                session = stripe.checkout.Session.create(
                    payment_method_types=["card"],
                    line_items=[
                        {
                            "price_data": {
                                "currency": currency,
                                "product_data": {
                                    "name": "Donation pour Poker Tool",
                                    "description": "Soutenez le developpement de Poker Tool",
                                },
                                "unit_amount": amount_cents,
                            },
                            "quantity": 1,
                        }
                    ],
                    mode="payment",
                    success_url=f"{origin}/?success=true&amount={amount}",
                    cancel_url=f"{origin}/?canceled=true",
                    metadata={
                        "donation_amount": str(amount),
                        "currency": currency,
                    },
                )

                return jsonify({"id": session.id})

            except stripe.error.StripeError as e:
                return jsonify({"error": str(e)}), 400
            except ValueError as e:
                return jsonify({"error": str(e)}), 400

        @donations_bp.route("/webhook", methods=["POST"])
        def stripe_webhook():
            """Handle Stripe webhook events."""
            try:
                payload = request.get_data(as_text=True)
                sig_header = request.headers.get("Stripe-Signature")

                if not sig_header:
                    return jsonify({"error": "Missing Stripe-Signature header"}), 400

                # Verify webhook signature
                event = stripe.Webhook.construct_event(
                    payload, sig_header, self.config.stripe_webhook_secret
                )

                # Handle the event
                if event["type"] == "checkout.session.completed":
                    session = event["data"]["object"]
                    # TODO: Handle successful payment
                    # - Log the donation
                    # - Send thank-you email
                    # - Update user status if authenticated
                    print(f"Payment succeeded for session: {session.id}")

                elif event["type"] == "checkout.session.expired":
                    session = event["data"]["object"]
                    print(f"Payment session expired: {session.id}")

                # ... handle other event types

                return jsonify({"status": "success"})

            except ValueError as e:
                # Invalid payload
                return jsonify({"error": str(e)}), 400
            except stripe.error.SignatureVerificationError as e:
                # Invalid signature
                return jsonify({"error": str(e)}), 400

        # Register the blueprint on the main API
        api.register_blueprint(donations_bp)
