"""
Use cases (Elegant Objects).

Each use case is a small object that encapsulates one business operation. It
receives its dependencies (ports) through the constructor (dependency
injection), so it can be unit-tested with simple in-memory fakes — no mocks,
no global state.

A use case returns domain objects or plain result values; it never knows
about HTTP (that stays in the infrastructure layer).
"""
