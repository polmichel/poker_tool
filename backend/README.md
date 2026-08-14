# Poker Tool Backend

A Flask backend for a poker range training tool, structured around
**Elegant Objects** principles (inspired by Yegor Bugayenko): objects that
expose behaviour (not state), dependencies injected through constructors, and
concrete adapters behind small abstract ports.

## 🏗️ Architecture

```
backend/
├── poker_tool/                      # Main package (the only backend)
│   ├── config.py                    # Environment-driven configuration
│   ├── app.py                       # Composition root (PokerTool) — wires DI
│   ├── main.py                      # Entry point (python -m poker_tool.main)
│   ├── objects/                     # Domain objects (pure, no I/O)
│   │   ├── user.py, range.py, hand.py, position.py, range_type.py, action.py
│   │   ├── training/
│   │   │   ├── session.py, question.py
│   │   └── stats/
│   │       ├── user_stats.py, global_stats.py
│   ├── interfaces/                  # Ports (abstract interfaces)
│   │   ├── storage.py               # Storage port
│   │   └── auth.py                  # Auth port
│   ├── adapters/                    # Concrete implementations of the ports
│   │   ├── sqlalchemy/              # SqlAlchemyStorage (Storage)
│   │   │   ├── storage.py, models.py
│   │   └── jwt/                     # JwtAuth (Auth)
│   │       └── auth.py
│   ├── infrastructure/             # Technical layer
│   │   └── web/
│   │       └── flask_app.py        # Flask routes (thin controllers)
│   └── tests/
│       ├── unit/                    # Unit tests with fake ports (no mocks)
│       └── integration/             # Composition / wiring tests
├── scripts/
│   └── create_test_data.py          # Seed script (uses poker_tool.app)
├── requirements.txt                 # Runtime + test dependencies
├── pyproject.toml                   # uv / project metadata
└── .env.example                     # Example environment configuration
```

### Layers

- **`objects/`** — pure domain objects. No Flask, no SQLAlchemy, no I/O. They
  expose behaviour (e.g. `range.grid()`, `session.answer(...)`) and are the
  only place business rules live.
- **`interfaces/`** — small abstract ports describing what the application
  needs (`Storage`, `Auth`). One responsibility per port.
- **`adapters/`** — concrete implementations of the ports (SQLAlchemy, JWT).
- **`infrastructure/web/`** — thin HTTP layer; routes delegate to objects and
  ports. No business logic here.
- **`app.py`** — the **composition root**: the single place that reads the
  environment (`Config`), constructs the concrete adapters and injects them.

### Configuration

All configuration is read from the environment through `poker_tool.config.Config`
and injected in the composition root. No secrets are hard-coded. See
`.env.example` for the available variables.

| Variable                       | Default                              | Description                  |
| ------------------------------ | ------------------------------------ | ---------------------------- |
| `SECRET_KEY`                   | `poker_tool_dev_secret_key`          | Flask secret key             |
| `JWT_SECRET_KEY`               | `poker_tool_dev_jwt_secret_key`      | JWT signing secret           |
| `DATABASE_URL`                 | `sqlite:///poker_tool.db`            | SQLAlchemy database URI      |
| `CORS_ORIGINS`                 | `*`                                  | Comma-separated origins      |
| `JWT_ACCESS_TOKEN_EXPIRES`      | `3600`                               | Token lifetime in seconds    |

> The defaults are for local development only. Provide real secrets in any
> non-dev environment.

## 🚀 Quick Start

```bash
cd backend
pip install -r requirements.txt
python -m poker_tool.main
```

The API is served at `http://localhost:5000/api`.

## 🧪 Testing

```bash
cd backend
pip install -r requirements.txt   # includes pytest
python -m pytest poker_tool/tests/unit/ -v
python -m pytest poker_tool/tests/integration/ -v
```

Tests use **fake implementations of the ports** rather than mocks: each port
gets a small in-memory fake, so unit tests exercise real object behaviour. The
integration tests verify that the composition root wires everything together.

## 📦 Dependencies

- **Flask** — web framework
- **Flask-CORS** — CORS support
- **Flask-JWT-Extended** — JWT authentication
- **Flask-SQLAlchemy** — ORM
- **pytest** — test runner

All dependencies are declared in `requirements.txt` (runtime + test) and in
`pyproject.toml` (uv metadata).

## 📚 Resources

- [Elegant Objects by Yegor Bugayenko](https://www.yegor256.com/elegant-objects.html)
- [Ports and Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/hexagonal-architecture/)
