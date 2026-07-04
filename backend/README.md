# Poker Tool Backend

A Flask-based backend for a poker range training tool, **restructured using Elegant Objects principles** (inspired by Yegor Bugayenko).

## 🏗️ Architecture

The backend follows a **clean architecture** with clear separation of concerns:

```
backend/
└── poker_tool/                          # Main package
    ├── domain/                          # 🏗️ Domain Layer (Pure Business Logic)
    │   ├── range.py      # Range, RangeType, Position, ActionType
    │   ├── hand.py       # Hand, RANKS, generate_all_hands()
    │   ├── user.py       # User (immutable)
    │   └── scenario.py   # Scenario, ScenarioType
    │
    ├── ports/                           # 🔌 Ports Layer (Abstractions)
    │   ├── database.py   # DatabasePort interface
    │   └── auth.py       # AuthPort interface
    │
    ├── adapters/                        # 🔌 Adapters Layer (Implementations)
    │   ├── sqlalchemy_db.py  # SQLAlchemy implementation of DatabasePort
    │   └── jwt_auth.py       # JWT implementation of AuthPort
    │
    ├── services/                        # 🎭 Services Layer (Use Cases)
    │   ├── range_service.py    # RangeService(database: DatabasePort)
    │   ├── auth_service.py     # AuthService(database, auth)
    │   └── training_service.py # TrainingService(database)
    │
    └── web/                             # 🌐 Web Layer (HTTP)
        └── routes/              # Flask routes with dependency injection
            └── __init__.py      # register_routes(app, services...)
    │
    ├── app.py                   # 🎛️ Application composition
    └── main.py                  # 🚀 Entry point
```

## 🎯 Key Principles (Elegant Objects)

1. **Immutable Objects**
   - All domain objects use `@dataclass(frozen=True)`
   - No setters, only pure functions
   - Example: `Range`, `User`, `Hand` are all immutable

2. **Dependency Injection**
   - No hidden dependencies (no singletons, no global state)
   - All dependencies are passed via constructors
   - Example: `RangeService(database: DatabasePort)`

3. **No `new` in Functions**
   - Use factories (`from_dict`, `create_app`) instead
   - Example: `Range.from_dict(data)` instead of `Range(...)`

4. **Ports & Adapters**
   - **Ports**: Abstract interfaces (what we need)
   - **Adapters**: Concrete implementations (how we do it)
   - Example: `DatabasePort` ↔ `SQLAlchemyDatabase`

5. **Testable Without Mocks**
   - Provide alternative implementations of ports for testing
   - Example: `FakeDatabase` implements `DatabasePort`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
uv sync  # Uses pyproject.toml for dependencies
```

### 2. Run the Application

```bash
# Option 1: Using the new structure
python -m poker_tool.main

# Option 2: Using the old structure (still works)
python app.py
```

The API will be available at `http://localhost:5000`

### 3. Run Tests

```bash
# Unit tests (no mocks!)
python -m pytest tests/unit/ -v

# All tests
python -m pytest tests/ -v
```

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Ranges
- `GET /api/ranges` - List all ranges
- `GET /api/ranges/<id>` - Get a specific range
- `POST /api/ranges` - Create a new range
- `PUT /api/ranges/<id>` - Update a range
- `DELETE /api/ranges/<id>` - Delete a range
- `GET /api/ranges/<id>/grid` - Get 13x13 grid for a range
- `GET /api/ranges/<id>/stats` - Get statistics for a range
- `GET /api/ranges/default` - Get default ranges

### Training
- `GET /api/training/modes` - List training modes
- `GET /api/training/sessions` - List training sessions
- `POST /api/training/sessions` - Create a training session
- `POST /api/training/sessions/<id>/next` - Submit answer and get next question
- `POST /api/training/sessions/<id>/end` - End a training session

## 🧪 Testing Philosophy

### No Mocks!

Instead of mocking dependencies, we:
1. **Create fake implementations** of ports
2. **Inject them** into services
3. **Test real behavior**

### Example: Testing RangeService

```python
from poker_tool.ports.database import DatabasePort
from poker_tool.services.range_service import RangeService

class FakeDatabase(DatabasePort):
    def save_range(self, range_obj):
        # Store in memory
        self.ranges[range_obj.id] = range_obj
        return range_obj
    # ... implement all abstract methods

# Test with real RangeService + FakeDatabase
db = FakeDatabase()
service = RangeService(db)
range_obj = service.create_range(name="Test Range")
# No mocks needed! ✨
```

See `tests/unit/test_range_service.py` and `tests/unit/test_auth_service.py` for examples.

## 📦 Dependencies

- **Flask** - Web framework
- **Flask-CORS** - CORS support
- **Flask-JWT-Extended** - JWT authentication
- **SQLAlchemy** - ORM
- **uv** - Dependency management

All dependencies are defined in `pyproject.toml`.

## 🔄 Migration from Old Structure

The old structure (`app.py`, `database.py`, `routes/`, `models/`) is still present but **deprecated**. 

To migrate:
1. Use the new `poker_tool/` package
2. Update imports to use domain objects
3. Inject dependencies instead of using global state

### Example Migration

**Old way:**
```python
from database import db, User
from routes import api_bp

app = Flask(__name__)
db.init_app(app)
app.register_blueprint(api_bp)
```

**New way:**
```python
from poker_tool.app import PokerToolApp

app = PokerToolApp()
app.run()
```

## 📚 Resources

- [Elegant Objects by Yegor Bugayenko](https://www.yegor256.com/elegant-objects.html)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/Hexagonal-architecture/)

## 🤝 Contributing

1. Follow Elegant Objects principles
2. Add tests for new features (without mocks!)
3. Keep domain objects immutable
4. Use dependency injection
5. Document your code

## 📄 License

MIT License - Feel free to use, modify, and distribute.
