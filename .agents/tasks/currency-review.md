# Currency fix: IDR→X Frankfurter conversion + per-language override

The change fixes two defects in the navbar currency selector. BUG 1: the live client display must be `raw_IDR × rates[selectedCurrency]` using the Frankfurter-backed IDR→X map from `GET /api/currency`, never a server-pre-converted number or a `× 1` shortcut. BUG 2: the currency override must be segregated per language so a choice on `/en` cannot leak into `/id`. The fix reworks `convertVariantImportPrices` in `src/lib/currency.js` to capture a genuine raw-IDR snapshot idempotently and derive the server SEO values from it, and reworks `CurrencyProvider.jsx` to namespace the override by locale (`ep.currency.id` / `ep.currency.en`), reselect reactively on locale change, and seed the rate map with real fallback rates instead of 1.

Watch for: nothing blocking. The uncommitted image `public/asset/product/Minyak Kayu Balitung/100 ml.jpg` was correctly left out of the commit (confirmed). The build evidence records a clean exit-0 compile.

**Verdict**: APPROVED

## High-level view

The conversion is a single multiplication. The client reads only the `*Idr` fields and runs them through `formatImport` → `convertFromIdr(amountIdr, activeRate)` = `amount * rate` exactly once, where `activeRate = rates[currency]` and `rates` is the `payload.rates` map served by `/api/currency` (= `getIdrRateMap()`, Frankfurter `base=idr`). For a 50,000 IDR item with `rates.EUR ≈ 0.000052`, the display is `EUR 2.60` — the map value is used directly, not 1 and not a USD shortcut.

The raw-IDR fields are protected against double conversion. `convertVariantImportPrices` now captures `importPriceIdr = variant.importPriceIdr ?? variant.importPrice ?? variant.price` (preferring an existing raw snapshot), and the server locale-default `importPrice`/`fromPrice` are computed *from* that snapshot. A second pass through the helper therefore keeps the `*Idr` fields on the original IDR number.

The override is per-locale. Storage keys are namespaced (`ep.currency.<locale>`); `setCurrency` writes only the current locale's key; a `[locale]` effect reselects the stored value for the active locale or falls back to that locale's default (id→IDR, en→USD). The legacy global `ep.currency` key is never read. First paint uses the SSR locale default, with the localStorage reconcile deferred to a post-mount effect, so there is no hydration mismatch. The `ep.rates`/`ep.ratesAt` cache keys are unchanged.

Server SEO renderers stay on the locale default and touch no browser state. `ProductDetailPage.jsx` (metadata, twitter, `product:price:*`, JSON-LD offers) and `NewsDetailPage.jsx` (`getProductPrice`) read `variant.importPrice`/`importDozenPrice` and `product.importCurrency` — the server-converted fields produced from the raw-IDR snapshot — and never read `window`/`localStorage`.

<details>
<summary>Issues (0)</summary>

No blocking or actionable findings. All six acceptance criteria pass.

</details>

<details>
<summary>Details</summary>

### Single IDR→target multiplication (criterion 1) — confirmed

`src/app/api/currency/route.js` returns `{ base: "IDR", rates, supported }` where `rates = await getIdrRateMap()`. `getIdrRateMap` (`src/lib/currency.js`) builds `{ IDR: 1, ...FALLBACK_RATES, ...fetched }` from the Frankfurter v2 `base=idr` endpoint parsed by `parseRatesFromPayload` (flat-array shape handled, each `quote→rate` kept). The client consumes `payload.rates` into `setRates` (`CurrencyProvider.jsx`), and `buildContextValue` sets `activeRate = rates?.[currency] ?? (currency === "IDR" ? 1 : FALLBACK_RATES[currency] ?? 1)`. `formatImport(amountIdr) = formatCurrency(convertFromIdr(amountIdr, activeRate), currency)` and `convertFromIdr = Math.round(amount * rate * 100)/100` — exactly one IDR→target multiply, no USD-only shortcut. A non-IDR currency missing from the live map falls back to a real IDR→X rate, never 1. EUR trace: `50000 × rates.EUR(≈0.000052) = 2.6 → EUR 2.60`.

### Raw-IDR fields are genuine original IDR (criterion 2) — confirmed

`convertVariantImportPrices` captures `importPriceIdr = variant.importPriceIdr ?? variant.importPrice ?? variant.price`, `importDozenPriceIdr = variant.importDozenPriceIdr ?? variant.importDozenPrice`, `fromPriceIdr = variant.fromPriceIdr ?? variant.fromPrice` before any conversion, preferring an existing `*Idr` snapshot. The returned `importPrice`/`importDozenPrice`/`fromPrice` are `convertAmount(*Idr, rate)` — derived from the snapshot, not re-read from the possibly-converted inputs — so a double pass cannot corrupt the `*Idr` values. Client consumers read only `*Idr`: `card/page.js` uses `importPriceIdr ?? price` and `fromPriceIdr ?? fromPrice`; `SearchProductClient.jsx` `getVariantPrice` import branch returns `importDozenPriceIdr` / `importPriceIdr ?? price`, the strike-through uses `fromPriceIdr ?? fromPrice`, and the discount % is computed on raw IDR totals (currency-independent). The WhatsApp import-branch price flows through `formatActivePrice → formatImport`, so the message is converted too.

### Local price and server SEO (criterion 3) — confirmed

Local branches render `price`/`dozenPrice`/`fromPriceLocal` via `formatCurrency(amount, "IDR")`; `convertVariantImportPrices` never touches `price`/`dozenPrice`. SEO: `ProductDetailPage.jsx` uses `variant.importPrice`/`importDozenPrice` and `product.importCurrency` for JSON-LD offers, metadata, twitter label, and `product:price:*`/`og:price:*`; `NewsDetailPage.jsx` `getProductPrice` uses `variant.importPrice` + `product.importCurrency`. Grep for `window`/`localStorage` in both files returned no matches. These fields come from `getProductById`/`getAllProducts` → `applyImportCurrency(..., locale)` / `applyImportCurrencyToProducts(..., locale)`, i.e. the server locale default.

### Per-language override segregation (criterion 4) — confirmed

`getCurrencyStorageKey(locale) = ep.currency.<locale>`. `setCurrency` writes only `ep.currency.<currentLocale>`. The `[locale]` effect runs `setCurrencyState(readStoredCurrencyForLocale(locale) ?? getDefaultCurrencyForLocale(locale))` on every locale change. `readStoredCurrencyForLocale` validates against `SUPPORTED_CURRENCIES` and returns null when absent. The legacy global `ep.currency` is never read. Trace: pick GBP on `/en` → writes `ep.currency.en=GBP`, `ep.currency.id` untouched; navigate `/id` → effect reads `ep.currency.id` (absent) → IDR; back to `/en` → reads GBP. No cross-bleed; independent defaults (id→IDR, en→USD).

### Hydration safety and signatures (criterion 5) — confirmed

First paint uses `useState(getDefaultCurrencyForLocale(locale))` (SSR locale default); the localStorage reconcile is in a post-mount `useEffect`, both rate and currency effects guard `typeof window === "undefined"`. No server-side browser access. `convertFromIdr`, `getIdrRateMap`, `getIdrToUsdRate`, `getImportConversionRate`, `applyImportCurrency`, `applyImportCurrencyToProducts`, and `getDefaultCurrencyForLocale` keep their signatures; the only API change is adding `export` to the pre-existing `FALLBACK_RATES`, which does not break callers.

### Build gate and commit scope (criterion 6) — confirmed

Build evidence at `.agents/tasks/currency-verification.md` records `✓ Compiled successfully in 11.9s`, 17/17 static pages, exit code 0, with no new compile/import/hydration/SSR errors — a clear pass (stronger than the accepted Prisma-prerender condition). Per the task, I did not re-run the build. Commit `da6350f` staged exactly `.agents/tasks/currency-verification.md`, `src/components/currencyProvider/CurrencyProvider.jsx`, and `src/lib/currency.js`. `git status` shows the unrelated `public/asset/product/Minyak Kayu Balitung/100 ml.jpg` still modified in the working tree and NOT included in the commit — correct.

</details>

<details>
<summary>File map</summary>

- `src/lib/currency.js` — idempotent raw-IDR snapshot in `convertVariantImportPrices`; server SEO values derived from the snapshot; `FALLBACK_RATES` exported.
- `src/components/currencyProvider/CurrencyProvider.jsx` — per-locale storage keys, reactive `[locale]` reselect, rate map seeded with real fallback rates.
- `.agents/tasks/currency-verification.md` — coder's build + verification trace.
- Unchanged but verified consumers: `src/components/card/page.js`, `src/app/product/[productId]/SearchProductClient.jsx`, `src/app/product/[productId]/ProductDetailPage.jsx`, `src/app/news/[slug]/NewsDetailPage.jsx`, `src/app/api/currency/route.js`, `src/app/api/products/productService.js`.

Full diff: `git show da6350f`.

</details>
