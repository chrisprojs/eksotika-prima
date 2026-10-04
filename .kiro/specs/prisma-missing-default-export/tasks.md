# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Default Import Resolves to `undefined` (Missing Default Export)
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists (the default import binding is `undefined`, and the production build fails)
  - **Scoped PBT Approach**: This is a deterministic bug, so scope the property to the concrete failing cases rather than random generation. The domain is the set of default imports `import prisma from "@/lib/prisma"` performed by the three known consumers (`src/app/api/admins/route.js`, `src/app/api/news/newsService.js`, `src/app/api/products/productService.js`). The property asserts: for every such import, the resolved default binding is a defined `PrismaClient` instance.
  - From Bug Condition in design: `isBugCondition(input)` holds when `input.importedModule == "@/lib/prisma"` AND `input.importKind == "default"` AND `moduleHasDefaultExport("@/lib/prisma") == false` AND the binding resolves to `undefined`
  - Test implementation details:
    - Default Import Resolution: dynamically import `@/lib/prisma` (or `src/lib/prisma.js`) and assert the default export is defined and exposes Prisma query methods such as `product.findMany`
    - Build Failure: run `npx next build` and observe it fails with "Export default doesn't exist in target module" / "The module has no exports at all" for the `@/lib/prisma` import traces
  - The test assertions should match the Expected Behavior Properties from design (default import resolves to the single configured `PrismaClient` instance; build succeeds)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "default import of @/lib/prisma resolves to `undefined`"; "`npx next build` fails on the admins route, newsService, and productService import traces")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Client Construction and Caching Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run and record behavior on the UNFIXED module first, then encode what you observed
  - Observe behavior on UNFIXED code for non-bug-condition inputs (behavior that does NOT depend on a default import resolving):
    - DATABASE_URL guard: with `process.env.DATABASE_URL` unset, loading the module / calling `getDatabaseUrl()` throws `Error("DATABASE_URL is not set")`
    - Adapter option selection: a `DATABASE_URL` starting with `file:` yields client options `{ url }`; a remote URL yields `{ url, authToken: process.env.TURSO_AUTH_TOKEN }`
    - GlobalThis caching: when `NODE_ENV !== "production"`, the instance is assigned to and reused from `globalThis.prisma`; when `NODE_ENV === "production"`, it is NOT assigned to `globalThis.prisma`
  - Write property-based tests capturing the observed behavior patterns from the Preservation Requirements in design:
    - Generate `DATABASE_URL` schemes (`file:` and remote) and assert adapter-option selection matches the observed mapping
    - Generate `NODE_ENV` values and pre-existing `globalThis.prisma` states and assert the caching/reuse behavior matches observations
    - Assert the DATABASE_URL-not-set throw path is unchanged
  - Property-based testing generates many combinations for stronger guarantees across the non-buggy input domain (`NOT isBugCondition`)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for missing default export in `src/lib/prisma.js`

  - [ ] 3.1 Add the default export
    - In `src/lib/prisma.js`, append `export default prisma;` as the final statement of the module
    - Place it after the `if (process.env.NODE_ENV !== "production") { globalForPrisma.prisma = prisma; }` block so the exported binding is the same `prisma` instance that is conditionally cached
    - Export the existing `const prisma`; do NOT re-create, wrap, or rename the client
    - Leave `getDatabaseUrl()`, `createPrismaClient()`, the `globalForPrisma` reference, and the caching conditional untouched
    - Make NO changes to the three consumers; they already use `import prisma from "@/lib/prisma"` and will resolve correctly once the default export exists
    - _Bug_Condition: isBugCondition(input) where input.importKind == "default" AND moduleHasDefaultExport("@/lib/prisma") == false (from design)_
    - _Expected_Behavior: default import resolves to the single configured PrismaClient instance; build succeeds (expectedBehavior from design)_
    - _Preservation: DATABASE_URL guard, file: vs. remote adapter selection, and non-production globalThis caching/reuse remain unchanged (Preservation Requirements from design)_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Default Import Resolves to the Shared Client
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied: the default import of `@/lib/prisma` resolves to the configured `PrismaClient` instance and exposes query methods
    - Run the bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Client Construction and Caching Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run the preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in the DATABASE_URL guard, adapter option selection, or globalThis caching/reuse)
    - Confirm all tests still pass after the fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run `npx next build` and confirm the production build completes successfully with no "Export default doesn't exist" / "module has no exports at all" errors on the `@/lib/prisma` import traces
  - Confirm the Property 1 (Bug Condition / Expected Behavior) test passes and the Property 2 (Preservation) tests pass
  - Ensure all tests pass; ask the user if questions arise
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_
