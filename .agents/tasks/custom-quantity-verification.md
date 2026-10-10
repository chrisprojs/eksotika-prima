# Verification — Custom Quantity with Dynamic Pricing

## What was implemented

- `SearchProductClient.jsx`
  - Added pure helper `computeCustomTotal({ singlePrice, dozenPrice, quantity })` (raw-IDR): `dozens = floor(N/12)`, `remainder = N%12`, `total = dozens*dozenPrice + remainder*singlePrice`; falls back to `N*singlePrice` when no dozen price.
  - Added `getRawUnitPrices(variant, priceType)` selecting import vs local raw-IDR single/dozen fields (mirrors `getVariantPrice` field precedence).
  - Widened `getValidQuantity` to accept any positive integer (clamp to >= 1; NaN/non-positive -> 1); still returns `"wholesale"`.
  - Extended `getVariantPrice` to price arbitrary numeric quantities via `computeCustomTotal`; single (1) and dozen (12-with-field) keep their exact existing branches byte-identical.
  - Added `quantityInput` controlled string state + a `useEffect` syncing it from `selectedQuantity` (skipped in wholesale).
  - Added `onCustomQuantityChange` handler: empty input keeps last valid quantity; valid integer >= 1 calls `changePrice(n)`.
  - Added a number `<input>` (min 1, step 1, inputMode numeric) after the quantity badges, disabled in wholesale.
  - `selectedQuantityText` now renders `${n} pcs` for custom quantities (keeps single/dozen/wholesale text otherwise) so the WhatsApp order message is correct.
  - Highlight rules are derived from `selectedQuantity` (1 => single, 12 => dozen, else none) — unchanged badge className logic now yields the required behavior.
- `page.css`: added `.searchProduct-quantity-label` and `.searchProduct-quantity-input` (with `:disabled`) matching the existing badge look.
- `i18n.js`: added `customQuantityLabel`, `customQuantityPlaceholder`, `pieceSuffix` to BOTH `id` and `en` `productDetail` blocks.
- `ProductDetailPage.jsx` (SEO server component): confirmed `getSelectedProductOptions` already coerces any non-12/non-wholesale quantity (including arbitrary integers like `?quantity=15`) to `"1"`, so numeric custom quantities render a graceful single-price title/offer without crashing. No code change needed (per "do not over-engineer SEO").

## Pure-helper price-math walkthrough (single=2000, dozen=10000 unless noted)

Verified with a throwaway Node script (`scripts/_tmp-custom-qty-check.mjs`, since deleted). All six cases passed:

| N  | dozen | expected | result |
|----|-------|----------|--------|
| 15 | 10000 | 16000 (1 dozen + 3 singles) | PASS |
| 12 | 10000 | 10000 (dozen highlighted) | PASS |
| 1  | 10000 | 2000 (single highlighted) | PASS |
| 24 | 10000 | 20000 (2 dozens) | PASS |
| 13 | 10000 | 12000 (1 dozen + 1 single) | PASS |
| 5  | null  | 10000 (5 * 2000, no dozen) | PASS |

Output: `ALL PASS` (exit 0).

## Lint

- `npm run lint` -> `next lint`. This project is on **Next.js 16**, which **removed the `next lint` subcommand**; the binary treats `lint` as a positional project-directory argument and errors (`Invalid project directory ... \lint`). The repo still ships a legacy `.eslintrc.json` (no `eslint.config.js` flat config), so `npx eslint` also cannot run under ESLint 9 without a flat config. This is a **pre-existing repo/tooling condition unrelated to this change** — the lint script was already broken before any edits. The authoritative gate used is `npm run build` (which runs the compiler + TypeScript checks).

## Build

Run from the worktree root. The worktree had no `node_modules`, so `npm install` was run first (added 373 packages, exit 0).

- `npm run build` (no env):
  - `✓ Compiled successfully in 8.6s`
  - `✓ Finished TypeScript` (no type/syntax errors)
  - Then FAILED during page-data collection with `DATABASE_URL is not set` (from `src/lib/prisma.js`) on the unrelated route `/en/news/[slug]`. The worktree lacks the `.env` files that live in the main repo.
- `npm run build` with a dummy `DATABASE_URL=file:./dummy.db`:
  - `✓ Compiled successfully`
  - `✓ Finished TypeScript`
  - `✓ Collecting page data using 15 workers`
  - Proceeded into static page generation; failed only with empty-database errors (`SQLITE_ERROR: no such table: News` / `main.Product`) while prerendering `/` and sitemaps — purely data/environment, no connection to the product detail route or this change.

**Conclusion:** compilation and TypeScript pass; the product detail page and i18n build cleanly. The only build failures are environment-level (missing `DATABASE_URL` / unseeded database) and are not caused by this change. A full `npm run build` to completion requires the main repo's `.env` and a seeded database, which this worktree does not have.

## Cleanup

- Throwaway `scripts/_tmp-custom-qty-check.mjs` deleted.
- Dummy db files removed.
