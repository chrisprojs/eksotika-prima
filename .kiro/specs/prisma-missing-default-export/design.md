# Prisma Missing Default Export Bugfix Design

## Overview

The shared Prisma client module `src/lib/prisma.js` constructs a `PrismaClient` instance (backed by a libSQL adapter and cached on `globalThis` outside production), but it never exports that instance. Three consumer modules import it as a default export: `src/app/api/admins/route.js`, `src/app/api/news/newsService.js`, and `src/app/api/products/productService.js`, each with `import prisma from "@/lib/prisma"`. Because the module has no `export default`, those imports resolve to `undefined`, and the production build (`npx next build` on Next.js 16.3.8 with Turbopack) fails.

The fix is intentionally minimal: add a single `export default prisma;` statement at the end of `src/lib/prisma.js`. All existing module behavior — `globalThis` caching in non-production, the `DATABASE_URL`-not-set throw, the `file:` vs. remote adapter option selection, and every query path the client exposes — must stay exactly as it is. The only observable change is that the module now has a default export, so consumer imports resolve to the live client instead of `undefined`.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a module performs `import prisma from "@/lib/prisma"` (a default import) while `src/lib/prisma.js` exposes no default export, so the imported binding is `undefined`.
- **Property (P)**: The desired behavior — the default import resolves to the single configured `PrismaClient` instance, so the build succeeds and consumers can call Prisma query methods (`prisma.product.findMany`, etc.).
- **Preservation**: All existing behavior of `src/lib/prisma.js` that must remain unchanged — client construction, the `DATABASE_URL` guard, `file:` vs. remote adapter selection, and `globalThis` caching in non-production.
- **prismaModule**: The module `src/lib/prisma.js` that builds and (after the fix) exports the shared `PrismaClient`.
- **prisma (the instance)**: The `const prisma` value in `src/lib/prisma.js`, either the cached `globalForPrisma.prisma` or a freshly created client from `createPrismaClient()`.
- **NODE_ENV**: The environment flag that gates whether the instance is cached on `globalThis` (cached only when not `"production"`).

## Bug Details

### Bug Condition

The bug manifests whenever a module default-imports from `src/lib/prisma.js`. The module defines `const prisma` and conditionally assigns it to `globalForPrisma.prisma`, but it contains no `export` statement of any kind. As a result the default import binding is `undefined` for every consumer, which breaks the Turbopack production build and would cause runtime failures (property access on `undefined`) if the module were otherwise reachable.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ModuleImport { importedModule, importKind, importedBinding }
  OUTPUT: boolean

  RETURN input.importedModule == "@/lib/prisma"
         AND input.importKind == "default"
         AND moduleHasDefaultExport("@/lib/prisma") == false
         AND input.importedBinding resolves to undefined
END FUNCTION
```

### Examples

- `src/app/api/products/productService.js` runs `import prisma from "@/lib/prisma"`, then calls `prisma.product.findMany(...)`. Expected: a configured client runs the query. Actual (unfixed): `prisma` is `undefined`; the build fails and a call would throw a "Cannot read properties of undefined" error.
- `src/app/api/news/newsService.js` runs `import prisma from "@/lib/prisma"` and uses `prisma` for news queries. Expected: queries execute. Actual (unfixed): default import is `undefined`.
- `src/app/api/admins/route.js` runs `import prisma from "@/lib/prisma"` for admin product operations. Expected: client is available. Actual (unfixed): default import is `undefined`.
- Edge case — `npx next build` (Next.js 16.3.8, Turbopack): the missing default export surfaces as a build-time failure, not just a runtime error. Expected after fix: the build completes.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `getDatabaseUrl()` continues to throw `Error("DATABASE_URL is not set")` when `process.env.DATABASE_URL` is absent.
- `createPrismaClient()` continues to select adapter options by URL scheme: `{ url }` when the URL starts with `file:`, otherwise `{ url, authToken: process.env.TURSO_AUTH_TOKEN }`.
- The libSQL client and `PrismaLibSQL` adapter are constructed exactly as before, and the `PrismaClient` is created with `{ adapter }`.
- `globalThis` caching is unchanged: `prisma` reuses `globalForPrisma.prisma` when present, and is assigned to `globalForPrisma.prisma` only when `process.env.NODE_ENV !== "production"`.
- Every Prisma query method already used by consumers behaves identically; the fix adds no new query logic.

**Scope:**
All behavior that does NOT depend on a default import resolving correctly must be completely unaffected by this fix. This includes:
- The `DATABASE_URL`-not-set throw path.
- Adapter option selection for `file:` versus remote (Turso) URLs.
- The non-production `globalThis` caching and instance-reuse logic.
- The set and semantics of query methods exposed by the client instance.

## Hypothesized Root Cause

Based on the bug description and the module source, the cause is:

1. **Missing Export Statement**: `src/lib/prisma.js` declares `const prisma = globalForPrisma.prisma || createPrismaClient();` but never exports it. The file ends after the non-production caching assignment with no `export default` (or named export).
   - Consumers assume a default export because they all use `import prisma from "@/lib/prisma"`.
   - With no default export, each binding resolves to `undefined`.

2. **Import/Export Contract Mismatch**: The three consumers (`admins/route.js`, `news/newsService.js`, `products/productService.js`) expect a default export, so the module's public contract and the consumers' expectations disagree.

3. **Build-Time Surfacing (Turbopack)**: Next.js 16.3.8 with Turbopack flags the unresolved default export during `npx next build`, turning what might otherwise be a latent runtime bug into a hard build failure.

The first cause is the direct, confirmed root cause (the file contains no export statement); the others describe why it manifests the way it does.

## Correctness Properties

Property 1: Bug Condition - Default Import Resolves to the Shared Client

_For any_ module that default-imports `@/lib/prisma` (where `isBugCondition` returns true on the unfixed module), the fixed module SHALL expose `prisma` as its default export so the imported binding resolves to the single configured `PrismaClient` instance, allowing the production build to succeed and consumers to invoke Prisma query methods.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Client Construction and Caching Unchanged

_For any_ behavior that does NOT depend on the default import resolving (the `DATABASE_URL` guard, `file:` vs. remote adapter option selection, libSQL/adapter/client construction, and non-production `globalThis` caching and reuse), the fixed module SHALL produce exactly the same result as the original module, preserving all existing client construction and caching behavior.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/lib/prisma.js`

**Target**: Module top-level (after the existing non-production caching block)

**Specific Changes**:
1. **Add Default Export**: Append `export default prisma;` as the final statement of the module.
   - Place it after the `if (process.env.NODE_ENV !== "production") { globalForPrisma.prisma = prisma; }` block so the exported binding is the same `prisma` instance that is (conditionally) cached.
   - Export the existing `const prisma`; do not re-create or wrap the client.

2. **No Other Edits**: Leave `getDatabaseUrl()`, `createPrismaClient()`, the `globalForPrisma` reference, and the caching conditional untouched.

3. **No Consumer Edits**: The three consumer files already use `import prisma from "@/lib/prisma"`; once the default export exists, their imports resolve correctly with no changes.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the unfixed module (the default import is `undefined` / the build fails), then verify the fix exposes the shared client and preserves all existing construction and caching behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute that the sole cause is the missing default export. If refuted (for example, if an export exists but something else breaks resolution), re-hypothesize.

**Test Plan**: Attempt to resolve the default import and run `npx next build` on the UNFIXED module to observe the failure, confirming the default binding is `undefined` and that this is what breaks the build.

**Test Cases**:
1. **Default Import Resolution Test**: Import the default from `@/lib/prisma` and assert it is defined (will fail on unfixed code — resolves to `undefined`).
2. **Build Failure Test**: Run `npx next build` and observe it fails due to the unresolved default export (will fail on unfixed code).
3. **Consumer Usage Test**: In a consumer context (e.g., calling `prisma.product.findMany`), observe the "property access on undefined" failure (will fail on unfixed code).
4. **Edge Case — Named vs. Default**: Confirm the module exposes no default export at all on the unfixed code (may surface as a module-shape assertion failure).

**Expected Counterexamples**:
- The default import binding is `undefined`.
- Possible causes: missing `export default`, import/export contract mismatch, build-time resolution failure under Turbopack. (Root cause analysis predicts the missing `export default`.)

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed module produces the expected behavior (default import resolves to the shared client, build succeeds).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := resolveDefaultImport("@/lib/prisma")   // after fix
  ASSERT result is the configured PrismaClient instance
  ASSERT result is defined AND exposes product/news query methods
  ASSERT `npx next build` succeeds
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed module produces the same result as the original module.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalModule.behavior(input) == fixedModule.behavior(input)
  // DATABASE_URL guard, file: vs remote adapter selection,
  // globalThis caching/reuse in non-production
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of `DATABASE_URL` values (file: and remote), `NODE_ENV` values, and pre-existing `globalThis.prisma` states.
- It catches edge cases in adapter-option selection and caching that targeted unit tests might miss.
- It provides strong guarantees that construction and caching behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on the UNFIXED module first for the guard, adapter selection, and caching paths, then write property-based tests capturing that behavior and re-run them against the fixed module.

**Test Cases**:
1. **DATABASE_URL Guard Preservation**: Observe that a missing `DATABASE_URL` throws `"DATABASE_URL is not set"` on unfixed code, then verify this still throws identically after the fix.
2. **Adapter Option Selection Preservation**: Observe that `file:` URLs produce `{ url }` and remote URLs produce `{ url, authToken }` on unfixed code, then verify selection is unchanged after the fix.
3. **GlobalThis Caching Preservation**: Observe that in non-production the instance is cached on and reused from `globalThis`, and not cached in production, on unfixed code, then verify this is unchanged after the fix.

### Unit Tests

- Assert the module's default export is defined and is a `PrismaClient` instance.
- Assert that `getDatabaseUrl()` throws when `DATABASE_URL` is unset.
- Assert `createPrismaClient()` selects `{ url }` for `file:` URLs and `{ url, authToken }` for remote URLs.
- Assert the non-production caching assignment to `globalThis.prisma` and reuse of an existing cached instance.

### Property-Based Tests

- Generate random `DATABASE_URL` schemes (`file:` and remote) and assert correct adapter-option selection is preserved.
- Generate random `NODE_ENV` and `globalThis.prisma` states and assert caching/reuse behavior is preserved.
- Across many combinations, assert the default export always resolves to a single, defined client instance.

### Integration Tests

- Run `npx next build` and assert it completes successfully with the fix in place.
- Exercise each consumer (`admins/route.js`, `news/newsService.js`, `products/productService.js`) and assert `prisma` is defined and query methods are callable.
- Verify that switching between non-production and production environments preserves the expected caching behavior end to end.
