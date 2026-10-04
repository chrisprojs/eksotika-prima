# Bugfix Requirements Document

## Introduction

The production build (`npx next build`, Next.js 16.3.8 with Turbopack) fails with 5 errors, all tracing back to a single root cause: `src/lib/prisma.js` constructs a Prisma client instance in a local `const prisma` but never exports it. Consumers import it as a default export (`import prisma from "@/lib/prisma"`), so Turbopack reports "Export default doesn't exist in target module" and "The module has no exports at all."

Affected importers (all expect a default export):
- `src/app/api/admins/route.js:1`
- `src/app/api/news/newsService.js:2`
- `src/app/api/products/productService.js:1`

Because these modules feed server components and app routes (news detail pages, product detail pages, product/news API routes), the broken import cascades into the build graph and blocks the production build entirely.

The fix is to export the constructed `prisma` client as the module's default export so the existing `import prisma from "@/lib/prisma"` statements resolve, and the build completes.

## Bug Analysis

### Current Behavior (Defect)

`src/lib/prisma.js` creates `const prisma` but has no `export` statement, so no binding is importable by consuming modules.

1.1 WHEN `src/lib/prisma.js` is imported via `import prisma from "@/lib/prisma"` THEN the system fails resolution because the module exposes no default export ("Export default doesn't exist in target module").
1.2 WHEN `npx next build` compiles any module that transitively imports `@/lib/prisma` (admins route, newsService, productService, and the pages/routes depending on them) THEN the build fails with an "Export ... doesn't exist / module has no exports at all" error for each import trace.

### Expected Behavior (Correct)

2.1 WHEN `src/lib/prisma.js` is imported via `import prisma from "@/lib/prisma"` THEN the system SHALL resolve the import to the constructed `PrismaClient` instance via a default export.
2.2 WHEN `npx next build` compiles modules that transitively import `@/lib/prisma` THEN the build SHALL complete successfully with the prisma client correctly importable and no "export doesn't exist" errors.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the module is loaded in a non-production environment THEN the system SHALL CONTINUE TO cache the client on `globalThis.prisma` to avoid creating multiple instances during hot reload.
3.2 WHEN `DATABASE_URL` is unset THEN the system SHALL CONTINUE TO throw "DATABASE_URL is not set".
3.3 WHEN `DATABASE_URL` starts with `file:` versus a remote URL THEN the system SHALL CONTINUE TO select client options accordingly (local file vs. url + `TURSO_AUTH_TOKEN`) via the libSQL adapter.
3.4 WHEN consumers call prisma methods (e.g. `prisma.product.findMany`, `prisma.product.findUnique`, `prisma.product.update`) THEN the system SHALL CONTINUE TO execute those queries against the same configured client as before.

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ModuleImport  // an import of "@/lib/prisma"
  OUTPUT: boolean

  // The module provides no default (nor any) export binding
  RETURN hasDefaultExport(targetModule(X)) = false
END FUNCTION
```

```pascal
// Property: Fix Checking - default export resolves to the client instance
FOR ALL X WHERE isBugCondition(X) DO
  binding ← resolveDefaultImport(X)
  ASSERT binding = constructedPrismaClient AND buildSucceeds()
END FOR
```

```pascal
// Property: Preservation Checking - unrelated behavior unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

- **F**: `src/lib/prisma.js` as it exists now (constructs `prisma`, caches on `globalThis` in non-production, no export).
- **F'**: Same module plus `export default prisma;`.
