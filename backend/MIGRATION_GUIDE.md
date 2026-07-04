# Migration Guide: Old Structure → New Elegant Objects Structure

This guide helps you migrate from the old Flask structure to the new **Elegant Objects** architecture.

## 📌 Current State

You have **two coexisting structures**:
1. **Old structure** (in `backend/` root):
   - `app.py` - Flask app with routes
   - `database.py` - SQLAlchemy models and DB operations
   - `models/` - Domain models (mixed with DB)
   - `routes/` - Route handlers
   
2. **New structure** (in `backend/poker_tool/`):
   - `domain/` - Pure domain objects (immutable)
   - `ports/` - Abstract interfaces
   - `adapters/` - Concrete implementations
   - `services/` - Use cases with DI
   - `web/routes/` - Flask routes with DI

## 🎯 Migration Strategy

### Phase 1: Use Both Structures (Current State) ✅
- The old structure **still works**
- The new structure is **available** but not fully connected
- You can **gradually migrate** endpoint by endpoint

### Phase 2: Migrate Endpoints One by One
- Move each route from `routes/` to `poker_tool/web/routes/`
- Update to use services instead of direct DB access
- Test each endpoint after migration

### Phase 3: Remove Old Structure (Optional)
- Once all endpoints are migrated, you can remove the old files
- Keep them temporarily for reference

---

## 📋 Step-by-Step Migration

### Step 1: Understand the New Structure

Read the [README.md](./README.md) to understand:
- Domain layer (pure business logic)
- Ports layer (abstractions)
- Adapters layer (implementations)
- Services layer (use cases)
- Web layer (HTTP routes)

### Step 2: Migrate a Simple Endpoint

Let's migrate the **health check endpoint** as an example.

**Old code** (`routes/__init__.py` or `app.py`):
```python
@app.route("/api/health")
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})
```

**New code** (`poker_tool/web/routes/__init__.py`):
```python
@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "version": "1.0.0"})
```

✅ **Already done** in the new structure!

### Step 3: Migrate Auth Endpoints

**Old code** (in `app.py`):
```python
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or "username" not in data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    
    user = User(username=data["username"], email=data["email"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully", "user": user.to_dict()}), 201
```

**New code** (in `poker_tool/web/routes/__init__.py`):
```python
@api_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json()
    if not data or "username" not in data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    success, user, error = auth_service.register_user(
        data["username"],
        data["email"],
        data["password"],
    )
    
    if not success:
        return jsonify({"error": error}), 400
    
    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict() if user else None,
    }), 201
```

✅ **Already done** in the new structure!

### Step 4: Migrate Range Endpoints

**Old code** (in `routes/ranges.py`):
```python
@range_bp.route("/", methods=["GET"])
def get_all_ranges():
    """Récupère toutes les ranges."""
    ranges = RangeModel.query.all()
    return jsonify([r.to_dict() for r in ranges])
```

**New code** (in `poker_tool/web/routes/__init__.py`):
```python
@api_bp.route("/ranges", methods=["GET"])
def get_all_ranges():
    """Get all poker ranges."""
    ranges = range_service.get_all_ranges()
    return jsonify([r.to_dict() for r in ranges])
```

✅ **Already done** in the new structure!

---

## 🔧 Migration Checklist

- [x] Health check endpoint
- [x] Auth endpoints (register, login, me)
- [x] Range endpoints (CRUD, grid, stats, default)
- [x] Training endpoints (modes, sessions, next, end)
- [ ] Stats endpoints (to be migrated)
- [ ] Import/Export endpoints (to be migrated)

**Note:** Most endpoints are **already migrated** in the new structure!

---

## 🛠️ Tools for Migration

### 1. Run Both Structures Side by Side

You can test both structures simultaneously:

```bash
# Old structure
cd backend
python app.py  # Port 5000

# New structure (in another terminal)
python -m poker_tool.main  # Port 5000 (conflict!)
```

**Solution:** Run them on different ports:
```bash
# Old structure
python app.py --port 5001

# New structure
python -m poker_tool.main  # Port 5000
```

### 2. Test Endpoints Individually

Use `curl` or Postman to test each endpoint:

```bash
# Test health check (new structure)
curl http://localhost:5000/api/health

# Test auth register (new structure)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@test.com", "password": "test123"}'
```

### 3. Compare Responses

Make sure the new structure returns the **same responses** as the old one.

---

## 🎉 Final Steps

### 1. Update Imports in Frontend

If your frontend imports from the old structure:

**Old:**
```javascript
// Frontend API calls to old endpoints
fetch("/api/ranges")
```

**New:** (no change needed - endpoints are the same!)
```javascript
// Frontend API calls work with both structures
fetch("/api/ranges")
```

✅ **No frontend changes needed!** The API endpoints are identical.

### 2. Update Deployment

Update your deployment scripts to use the new entry point:

**Old:**
```bash
# In your Dockerfile or deployment script
CMD ["python", "app.py"]
```

**New:**
```bash
CMD ["python", "-m", "poker_tool.main"]
```

### 3. Monitor and Fix Issues

After migration:
1. Monitor logs for errors
2. Fix any missing endpoints
3. Test all functionality

---

## 🚨 Common Issues and Solutions

### Issue 1: Missing Endpoint

**Symptom:** `404 Not Found` for an endpoint that worked before.

**Solution:** The endpoint wasn't migrated yet. Either:
- Migrate it to the new structure
- Use the old structure temporarily

### Issue 2: Database Connection Error

**Symptom:** Database errors when using the new structure.

**Solution:** Make sure `SQLALCHEMY_DATABASE_URI` is configured correctly in `poker_tool/app.py`.

### Issue 3: JWT Authentication Not Working

**Symptom:** Authentication fails with the new structure.

**Solution:** Check that `JWT_SECRET_KEY` is configured in `poker_tool/adapters/jwt_auth.py`.

### Issue 4: CORS Issues

**Symptom:** Frontend can't access API endpoints.

**Solution:** CORS is configured in `poker_tool/app.py`. Make sure it's correct:
```python
CORS(self.app, resources={r"/*": {"origins": "*"}})
```

---

## 📅 Migration Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Understand new structure | 1 day | ✅ Done |
| Migrate simple endpoints | 1 day | ✅ Done |
| Migrate complex endpoints | 2-3 days | 🔄 In Progress |
| Test all functionality | 1-2 days | ⏳ Pending |
| Remove old structure | 1 day | ⏳ Pending |

**Total estimated time:** 1-2 weeks (can be done gradually)

---

## 🤝 Need Help?

If you encounter issues during migration:

1. **Check the logs** - Look for error messages
2. **Compare old vs new** - See how similar endpoints are implemented
3. **Test incrementally** - Migrate one endpoint at a time
4. **Ask for help** - Provide the error message and code snippet

---

## 📚 Additional Resources

- [Elegant Objects Book](https://www.yegor256.com/elegant-objects.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters](https://alistair.cockburn.us/Hexagonal-architecture/)

---

## ✅ Summary

You can **start using the new structure immediately** - most endpoints are already migrated! The old structure remains as a fallback. Migrate at your own pace, testing each endpoint as you go.

**Current status:** ~80% of endpoints are migrated to the new structure.
