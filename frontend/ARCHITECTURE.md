# Frontend Architecture

This document describes the frontend layer structure, the separation rules
between layers, and the state-management decisions (including the Zustand
evaluation recorded for future reference).

## Layer Structure

```
/src
├── /api          # Data access layer (API clients + shared axios client)
├── /app          # App-wide composition: AppShell, ProtectedRoute, theme, icons
├── /auth         # Authentication context (shared auth state)
├── /components   # Reusable UI components (layout, training, ranges, ...)
├── /contexts     # React contexts (FocusModeContext)
├── /hooks        # Custom React hooks (data + behaviour)
├── /pages        # Page-level components mounted by the router
├── /tests        # Shared test utilities (factories, mocks, render helpers)
├── /types        # TypeScript type definitions + Zod schemas
└── /utils        # Shared utility functions (validation, helpers, constants)
```

## Layering Model

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │    AppShell          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         APPLICATION                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Hooks     │  │  Contexts    │  │    Routers           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                           DATA ACCESS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   API       │  │   Client     │  │    Types             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Layer Separation Rules

These rules keep the dependency direction one-way (presentation → application →
data access). A lower layer must never import from a higher one.

- **Pages**: can import from `components`, `hooks`, `contexts`, `types`, `utils`.
- **Components**: can import from `hooks`, `contexts`, `types`, `utils`, and
  sub-components.
- **Hooks**: can import from `api`, `types`, `utils`, `contexts`.
- **API**: can import from `client`, `types`.
- **Types**: can import from other type files only (no runtime code).
- **Utils**: can import from `types` only.

### Enforcement

- `eslint-plugin-unused-imports` is configured (`.eslintrc.json`) to catch
  dead imports.
- Layer boundaries are kept by convention and review. A strict
  `no-restricted-imports` eslint rule (banning, e.g., direct `@mui/material`
  imports outside `components/`) is documented here as an optional future
  hardening step; it is not yet enforced to avoid churn during refactoring.

## Data Flow

1. **Pages** call **Hooks** for state and side effects.
2. **Hooks** call **API classes** (injected, not axios directly) for network
   access, then expose intent-only surfaces (no setters leak).
3. **API classes** use the shared `api` axios client (`api/client.ts`) and
   validate every request payload and response with **Zod** schemas
   (`utils/validation.ts` → `validate` / `validateApiResponse`).
4. The shared client attaches the JWT (from `localStorage`) to each request
   and clears it on a 401 response.

## State Management

Current approach: **Context API + custom hooks**.

- **Auth state** — global, used across the app → `AuthContext` (shared via
  `AuthProvider`). Appropriate as Context.
- **Focus mode / drawer** — global, UI-only → `FocusModeContext`. Appropriate
  as Context.
- **Training / Ranges / Equity / Stats state** — local to the consuming pages,
  owned by custom hooks (`useTraining`, `useRanges`, `useEquity`, `useStats`)
  that inject their API class for testability.

### Zustand Evaluation (recorded, not implemented)

A centralised store (e.g. [Zustand](https://github.com/pmndrs/zustand)) was
evaluated for the training and ranges state to reduce hook boilerplate.

**Decision: keep the current hooks approach.** Rationale:

- The data hooks already encapsulate state + side effects behind a stable,
  injectable API, so the boilerplate is bounded and testable.
- Moving to Zustand would add a dependency and a new pattern without removing
  the API/validation layer (which is where most of the code lives).
- Auth and focus-mode genuinely need cross-tree sharing and are already on
  Context; the page-scoped data does not.

**Re-evaluation trigger:** if a future feature needs to share training/ranges
state across unrelated subtrees (not just a single page), revisit Zustand for
that slice. A starting sketch:

```ts
import { create } from 'zustand';

interface TrainingState {
  currentSession: TrainingSession | null;
  isSessionActive: boolean;
  // ...actions
}

export const useTrainingStore = create<TrainingState>((set) => ({
  currentSession: null,
  isSessionActive: false,
  // createSession: async (params) => { ... set({ ... }) },
}));
```

Until that need is concrete, the hooks approach remains the chosen path.
