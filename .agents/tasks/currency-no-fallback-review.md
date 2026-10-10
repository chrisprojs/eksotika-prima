# Currency no-fallback IDR + "exchange rate unavailable" popup

Removes the hardcoded `FALLBACK_RATES` table so a missing exchange rate is never used to guess a conversion. When no live rate is available, amounts stay in raw IDR with an IDR label on both the server (SEO/JSON-LD) and the client (cards, product detail, WhatsApp message). A dependency-free corner toast (`CurrencyNotice`) fires once when the client-side Frankfurter fetch fails with no fresh cache, telling the user prices are shown in IDR. The gating is driven by a new `ratesUnavailable` provider flag that is hydration-safe (starts false, flips only post-mount).

Watch for: nothing blocking. The number/label coupling is enforced centrally — client via `hasRate` in `buildContextValue`, server via `resolveImportConversion` forcing `importCurrency: "IDR"` whenever the effective rate is 1 — so a foreign label can't sit on an unconverted IDR amount (confirmed). An unrelated binary change to a product image (`100 ml.jpg`) is bundled in the same working tree (confirmed).

**Verdict**: APPROVED

## High-level view

The guessed-rate table is gone from `src/lib/currency.js`. The only guaranteed rate is `IDR: 1`; the fetched Frankfurter map is merged on top, and on failure (or missing USD) the map collapses to exactly `{ IDR: 1 }`. `getIdrToUsdRate` now returns `null` for "no rate," and `getImportConversionRate` turns that into an effective rate of 1 (no conversion) rather than a guess.

Label/rate coupling is the heart of correctness. Server side, a single `resolveImportConversion` resolves both the rate and the label together and forces the label to IDR whenever the effective rate is 1; the news service was switched from the old separate `getImportCurrency` + `getImportConversionRate` calls (which could desync) to this combined resolver. Client side, `buildContextValue` computes `hasRate` and formats with the IDR label when the selected currency has no finite-positive rate.

The popup is a plain React component gated on a new `ratesUnavailable` flag. The flag starts false (so SSR and first paint match), flips to true only inside the post-mount fetch effect and only when a live fetch fails with no fresh cache, and resets to false on a successful fetch. The toast fires once per false→true transition, is dismissible by button, Escape, and a 7s timer, sits bottom-right below the top-fixed navbar, and is responsive at ≤768px.

<details>
<summary>Issues (1)</summary>

1. **Unrelated image change bundled** — `public/asset/product/Minyak Kayu Balitung/100 ml.jpg` is modified in the same working tree as the currency change; unrelated to the task, consider committing separately.

</details>

<details>
<summary>Details</summary>

### (1) FALLBACK_RATES fully removed; only guaranteed rate is IDR: 1

Confirmed. The `FALLBACK_RATES` constant and its comment block are deleted from `src/lib/currency.js`, and the import is removed from `CurrencyProvider.jsx`. A workspace regex across `src/**/*.{js,jsx}` for `FALLBACK_RATES` and the old magic numbers (`0.000056`, `0.000052`, `0.000044`) returns no matches. The success map is `{ IDR: 1, ...fetched }` and the catch/no-cache map is `cachedRates || { IDR: 1 }`. The only hardcoded rate anywhere is `IDR: 1`.

### (2) Fetch failure => { IDR: 1 }, no guessed conversion, IDR number and label agree

Confirmed on both sides.

Server: on fetch failure `getIdrRateMap` returns `{ IDR: 1 }`, so `getIdrToUsdRate` returns `null`, so `getImportConversionRate` returns `1` even for the USD (en) locale. `resolveImportConversion` sees `rate === 1` (`converted` is false) and forces `importCurrency: "IDR"`. `applyImportCurrency` / `applyImportCurrencyToProducts` then attach `importCurrency: "IDR"` and `convertVariantImportPrices(variant, 1)` passes amounts through unchanged (the `rate === 1` branch in `convertAmount`). The SEO renderer `ProductDetailPage.jsx` reads `product.importCurrency || "IDR"` for both the offers currency and the JSON-LD `priceCurrency`, so label and raw-IDR number agree.

Client: `buildContextValue` computes `hasRate = currency === "IDR" || (Number.isFinite(selectedRate) && selectedRate > 0)`. With a non-IDR selection and `rates = { IDR: 1 }`, `selectedRate` is `NaN` → `hasRate` false → `convertImport` returns the raw IDR amount and `formatImport` returns `formatCurrency(amountIdr, "IDR")`. This flows unchanged through every import-branch consumer:

- Card (`src/components/card/page.js`): `priceText` and `fromPriceText` both go through `formatImport`; discount % is computed on raw IDR (currency-independent).
- Product detail (`SearchProductClient.jsx`): the import branch's `formatActivePrice` → `formatImport`, so the headline price, the strike-through (`formatActivePrice(fromPriceTotal)`), and the WhatsApp price (`selectedPriceText` = `formatActivePrice(selectedPrice)`) all show raw IDR labeled IDR. Discount % is computed on IDR totals. The local branch always uses `formatCurrency(amountIdr, "IDR")`.

### (3) Real rate present => single raw_IDR × rate multiply, correct label, invariants preserved

Confirmed.

EUR client trace: live fetch yields `parsed.EUR`, so `rates = { IDR: 1, ...parsed }`, `selectedRate = rates.EUR > 0`, `hasRate` true. `formatImport(amountIdr)` → `formatCurrency(convertFromIdr(amountIdr, rates.EUR), "EUR")` — one `raw_IDR × rates.EUR` multiply, labeled EUR. No double pass.

Server USD trace: a real USD rate makes `getImportConversionRate("en")` return that rate (≠ 1), `resolveImportConversion` keeps `importCurrency: "USD"`, and `convertVariantImportPrices` multiplies the raw-IDR snapshots once. The raw-IDR snapshot fields (`importPriceIdr`/`importDozenPriceIdr`/`fromPriceIdr`) are untouched by the edits, so a double pass through the helper still yields the correct result.

Local price always IDR: the local branch and the `price`/`dozenPrice` fields are never converted. Per-language override and hydration safety preserved: the provider still uses namespaced `ep.currency.{id,en}` keys with a locale-reactive reselect effect, caches `ep.rates`/`ep.ratesAt` for 1h, and fetches `EXCHANGE_RATE_ENDPOINT` directly. No `/api/currency` route exists (file search returned nothing). All named public signatures remain exported with working signatures; `convertVariantImportPrices` and `resolveImportConversion` are now exported (previously internal) — behavior unchanged.

### (4) Popup component: dependency-free, accessible, non-blocking, once-per-failure

Confirmed. `src/components/currencyNotice/CurrencyNotice.jsx` + `page.css` exist with no third-party dependency. The toast renders a titled "Exchange rate unavailable" notice with the "prices are shown in IDR" line. It is `role="status"` + `aria-live="polite"`, with a labeled close button (`aria-label="Dismiss"`), Escape-to-dismiss, and a 7s auto-dismiss timer (cleared on unmount/dismiss). It fires once per failed load via the `previousUnavailable` ref tracking the false→true transition. CSS fixes it bottom-right at `z-index: 900` (below the navbar's `1000`, and the navbar is top-fixed, so the bottom-right toast never covers the currency selector), with no backdrop/overlay. Responsive at ≤768px (spans with side margins, no overflow) and respects `prefers-reduced-motion`.

### (5) Popup wiring: ratesUnavailable flag, hydration-safe, inside provider subtree

Confirmed. `ratesUnavailable` is a `useState(false)` in `CurrencyProvider`, threaded through `buildContextValue` into the context value and included in the `useCurrency()` no-provider defaults (`ratesUnavailable: false`). It flips to true only inside the post-mount fetch effect via `markUnavailable()`, which guards on `!hasFreshCache`, so it is set only when a live fetch fails (non-OK response, no usable USD parse, or network/parse throw) AND no fresh cache covered the load. It resets to false on a successful fetch (`setRatesUnavailable(false)`). Because it starts false and only changes post-mount, it never renders true server-side; `CurrencyNotice` returns `null` until `visible`, so the server render and first paint stay empty. `CurrencyNotice` is mounted in `src/app/layout.js` inside `<CurrencyProvider>` (after `<Footer />`), so `useCurrency()` resolves.

### (6) Build evidence

Confirmed present and passing. The coder's recorded evidence in `currency-no-fallback-and-notice.md` shows `npm run build` reaching `✓ Compiled successfully in 1165ms` with exit code 0, static generation completing (16/16), and no new compile/import/hydration/SSR error. The pre-existing Prisma initialization error is tolerated per the task and did not block the build. Per instructions the build was not re-run.

### File map

- `src/lib/currency.js` — removed `FALLBACK_RATES`; `getIdrRateMap` merges only live rates; `getIdrToUsdRate` returns null when no USD; `getImportConversionRate` returns 1 when null; `resolveImportConversion` forces IDR label at rate 1; exported `resolveImportConversion` + `convertVariantImportPrices`.
- `src/app/api/news/newsService.js` — both label+rate sites switched to the combined `resolveImportConversion(locale)`.
- `src/components/currencyProvider/CurrencyProvider.jsx` — dropped fallback seed; `DEFAULT_RATES = { IDR: 1 }`; `hasRate`-based IDR formatting; added hydration-safe `ratesUnavailable` state and effect wiring.
- `src/components/currencyNotice/CurrencyNotice.jsx` + `page.css` — new accessible, non-blocking corner toast (untracked by git).
- `src/app/layout.js` — mounts `<CurrencyNotice />` inside the provider.
- `public/asset/product/Minyak Kayu Balitung/100 ml.jpg` — unrelated binary image change bundled in the working tree.

Full diff: `git diff v-6.0` (plus untracked `src/components/currencyNotice/`).

</details>
