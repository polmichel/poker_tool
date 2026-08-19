"""
Application configuration (Elegant Objects).

A single object that exposes environment-driven configuration to the rest of
the application. It is constructed once in the composition root (``PokerTool``)
and injected where needed, so no object reads the environment directly.

For local development the defaults are safe-ish; in any non-dev environment
the relevant variables must be provided via the environment (see
``backend/.env.example``).
"""
import os


class Config:
    """Environment-driven application configuration."""

    def __init__(self, env: dict | None = None) -> None:
        self._env = env if env is not None else os.environ

    @property
    def secret_key(self) -> str:
        return self._env.get("SECRET_KEY", "poker_tool_dev_secret_key")

    @property
    def jwt_secret_key(self) -> str:
        return self._env.get("JWT_SECRET_KEY", "poker_tool_dev_jwt_secret_key")

    @property
    def database_uri(self) -> str:
        return self._env.get("DATABASE_URL", "sqlite:///poker_tool.db")

    @property
    def cors_origins(self) -> list[str]:
        raw = self._env.get("CORS_ORIGINS", "*")
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def jwt_access_token_expires_seconds(self) -> int:
        try:
            return int(self._env.get("JWT_ACCESS_TOKEN_EXPIRES", "3600"))
        except ValueError:
            return 3600

    @property
    def stripe_secret_key(self) -> str:
        return self._env.get("STRIPE_SECRET_KEY", "")

    @property
    def stripe_webhook_secret(self) -> str:
        return self._env.get("STRIPE_WEBHOOK_SECRET", "")

    @property
    def frontend_url(self) -> str:
        return self._env.get("FRONTEND_URL", "http://localhost:3000")
