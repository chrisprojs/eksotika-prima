# Currency fixes — verification trace

Branch: v-6.0 (worked directly in main working tree, no worktree/branch/push).

## Build outcome (automated gate)

Ran `npm run build` from the repo root.

- Result: `✓ Compiled successfully in 11.9s`, TypeScript finished, static pages
  generated (17/17), process exited with code 0.
- No new compile / import / hydration / SSR errors were introduced. (The task
  notes a possible pre-existing Prisma `PrismaClientInitializationError` at the
  data-collection phase; in this run the build completed fully with exit code 0,
  so the gate is a clear PASS.)

## BUG 1 — Conversion is a single IDR → selected-currency multiply via the Frankfurter map

### Server data path (traced)

DB `Variant` columns are all IDR: `price`, `fromPrice`, `importPrice`,
`importDozenPrice` (import* are `price * (1 + gap%)`, still IDR — confirmed in
`prisma/schema.prisma` and the import-pricing migration triggers).

- `productService.getAllProducts` → `applyImportCurrencyToProducts(..., locale)`
- `productService.getProductById` → `applyImportCurrency(..., locale)`
- `newsService` → `applyImportCurrencyToProducts(products, { rate, importCurrency })`

Each product passes through the conversion exactly once per request. The
conversion helper `convertVariantImportPrices(variant, rate)` now:

1. Captures the genuine raw IDR snapshot FIRST, preferring an existing raw-IDR
   field if present:
   - `importPriceIdr = variant.importPriceIdr ?? variant.importPrice ?? variant.price`
   - `importDozenPriceIdr = variant.importDozenPriceIdr ?? variant.importDozenPrice`
   - `fromPriceIdr = variant.fromPriceIdr ?? variant.fromPrice`
   This makes the raw-IDR capture idempotent: even if a variant were passed
   through the helper twice, the `*Idr` fields keep the ORIGINAL IDR number and
   are never a re-converted value.
2. Computes the server locale-default values (`importPrice`, `importDozenPrice`,
   `fromPrice`) FROM the raw-IDR snapshot (`convertAmount(importPriceIdr, rate)`),
   so these SEO-only fields are also safe under a double pass.

So the `*Idr` fields reaching the client are guaranteed original IDR amounts,
never double-converted.

### Client conversion (single IDR → target multiply)

- `card/page.js` reads `variant.importPriceIdr ?? variant.price` and
  `variant.fromPriceIdr ?? variant.fromPrice`, then calls `formatImport(...)`.
- `SearchProductClient.jsx` reads `importPriceIdr`/`importDozenPriceIdr`/
  `fromPriceIdr` (import branch) and calls `formatImport(...)`; the WhatsApp buy
  message price uses the same `formatActivePrice` path, so the import-branch
  message price is converted too. The strike-through from-price and the
  discount % are computed on raw IDR numbers (currency-independent).
- `formatImport(amountIdr)` in `CurrencyProvider` =
  `formatCurrency(convertFromIdr(amountIdr, activeRate), currency)`.
  `convertFromIdr` = `amount * rate` (unchanged). So the on-screen number is
  exactly `raw_IDR × activeRate`.
- `activeRate = rates[currency]` where `rates` is `payload.rates` fetched from
  `GET /api/currency`, which returns `getIdrRateMap()` (Frankfurter v2
  `base=idr`, flat array parsed into an IDR→X map incl. `IDR: 1`).

Worked example for a non-USD currency (EUR), raw price 50,000 IDR, `rates.EUR ≈
0.000052`: displayed = `50000 × 0.000052 = 2.6` → `EUR 2.60`. For USD with
`rates.USD ≈ 0.000056`: `50000 × 0.000056 = 2.8` → `USD 2.80`. The map value is
used directly (a ~5e-5-scale number), not 1 and not a USD-only shortcut.

### No reuse of server-pre-converted numbers / no "× 1" for foreign currency

- The client reads ONLY the `*Idr` fields for display; it never reads the
  server-pre-converted `importPrice`/`fromPrice` or `product.importCurrency`.
- `activeRate` now falls back to `FALLBACK_RATES[currency]` (a real IDR→X rate)
  for a non-IDR currency missing from the live map, instead of `1`. The rate
  state is also seeded with `{ IDR: 1, ...FALLBACK_RATES }`, so a non-IDR
  selection converts with a genuine rate even before the live map resolves.
  IDR stays at rate 1 (local price unchanged).

## BUG 2 — Per-language override segregation

`CurrencyProvider`:

- Storage keys are namespaced per locale: `ep.currency.id`, `ep.currency.en`
  (rate cache keys `ep.rates` / `ep.ratesAt` unchanged).
- First paint uses `getDefaultCurrencyForLocale(getLocaleFromPathname(pathname))`
  (id→IDR, en→USD) to match SSR — hydration-safe. The `localStorage` reconcile
  runs in a post-mount effect.
- A `[locale]` effect reselects currency on every locale change: it reads the
  CURRENT locale's key; if absent/invalid it falls back to that locale's
  default. Navigating `/id ↔ /en` therefore swaps to the correct per-language
  value with no cross-bleed.
- `setCurrency(next)` writes ONLY `ep.currency.<currentLocale>`, so choosing a
  currency on `/en` writes `ep.currency.en` and leaves `ep.currency.id`
  untouched (and vice-versa).
- The legacy global `ep.currency` key is never read, so it cannot override
  either language.

Cross-bleed scenario trace:
1. On `/en`, user picks GBP → writes `ep.currency.en = GBP`; `ep.currency.id`
   untouched.
2. Navigate to `/id` → `[locale]` effect reads `ep.currency.id` (absent) →
   falls back to IDR (id default). `/id` shows IDR, not GBP.
3. Navigate back to `/en` → reads `ep.currency.en = GBP` → shows GBP.
Independent defaults and independent overrides confirmed.

## Local price + SEO (unchanged)

- Local price always IDR: `card`/`SearchProductClient` local branch uses
  `price`/`dozenPrice`/`fromPriceLocal` with `formatCurrency(amount, "IDR")`;
  the import conversion never touches `price`/`dozenPrice`.
- Server SEO stays on locale default and reads no browser state:
  - `ProductDetailPage.jsx` metadata / twitter price / `product:price:*` /
    JSON-LD offers read `variant.importPrice`/`importDozenPrice` and
    `product.importCurrency` — the server locale-default converted values.
  - `NewsDetailPage.jsx` `getProductPrice` reads `variant.importPrice` and
    `product.importCurrency`.
  These fields are still produced by `convertVariantImportPrices` (now computed
  from the raw-IDR snapshot), so SEO output is unchanged and never depends on
  window/localStorage.

## Signatures preserved

`convertFromIdr`, `getIdrRateMap`, `getIdrToUsdRate`, `getImportConversionRate`,
`applyImportCurrency`, `applyImportCurrencyToProducts`, and
`getDefaultCurrencyForLocale` keep their existing signatures; only an additional
`export` was added to the already-existing `FALLBACK_RATES` constant.
