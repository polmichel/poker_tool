// Vitest runs with `globals: true`, so `vi` is available globally at runtime,
// but TypeScript has no ambient declaration for it. `jest`/`describe`/`it`/
// `expect` stay typed through @types/jest; this declares only `vi` (used for
// hoisted `vi.mock` and `vi.importActual`) without pulling in vitest/globals,
// which would duplicate those jest-provided ambient declarations.
declare const vi: (typeof import('vitest'))['vi'];
