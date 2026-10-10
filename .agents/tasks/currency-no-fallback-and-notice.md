# Verification — Currency: no-fallback IDR + "exchange rate unavailable" popup

Two combined changes implemented per `currency-no-fallback-plan.md`:

- Part A: removed the hardcoded `FALLBACK_RATES` table so an unavailable rate shows the raw
  IDR amount with an IDR label on both client and server (never a guessed conversion).
- Part B: added a beautiful, dependency-free, non-blocking corner toast
  (`CurrencyNotice`) that fires once when the client Frankfurter fetch fails with no fresh
  cache, telling the user prices are shown in IDR.

## Files changed

- `src/lib/currency.js` — removed `FALLBACK_RATES`; `getIdrRateMap` success map is
  `{ IDR: 1, ...fetched }`, failure/no-cache map is `{ IDR: 1 }`; `getIdrToUsdRate` returns
  `null` when no usable USD rate; `getImportConversionRate` returns `1` (no conversion) when
  the USD rate is null; `resolveImportConversion` forces `importCurrency: "IDR"` whenever the
  effective rate is `1`; exported `resolveImportConversion` and `convertVariantImportPrices`.
- `src/app/api/news/newsService.js` — both label+rate sites (`applyImportCurrencyToNewsList`
  and the single-news path) now call the combined `resolveImportConversion(locale)` so the
  label can never desync from the rate.
- `src/components/currencyProvider/CurrencyProvider.jsx` — dropped the `FALLBACK_RATES`
  import and the seeded `DEFAULT_RATES`; `DEFAULT_RATES = { IDR: 1 }`; `buildContextValue`
  computes `hasRate` and returns the raw IDR amount with an IDR label when the selected
  currency has no finite-positive rate; `nextRates = { IDR: 1, ...parsed }`; added the
  SSR-safe `ratesUnavailable` state set true only on a live-fetch failure with no fresh
  cache and reset false on a successful fetch; threaded through context and the no-provider
  defaults.
- `src/components/currencyNotice/CurrencyNotice.jsx` + `page.css` — new popup component.
- `src/app/layout.js` — mounts `<CurrencyNotice />` inside `<CurrencyProvider>`.

## Build evidence

Command: `npm run build` (repo root). Result: **PASS**.

```
▲ Next.js 16.3.8 (Turbopack)
✓ Compiled successfully in 1165ms
✓ Collecting page data using 15 workers in 3.4s
✓ Generating static pages using 15 workers (16/16) in 2.1s
✓ Finalizing page optimization
Exit Code: 0
```

`✓ Compiled successfully` reached with exit code 0. No new compile/import/hydration/SSR
error. (The pre-existing Prisma `PrismaClientInitializationError` is tolerated per the task;
it did not block this build.) `npm run lint` is non-functional on Next 16 and was not relied
on. Files are syntactically clean.

Sanity grep: `rg -n "FALLBACK_RATES" src` returns nothing (confirmed via workspace search —
no matches).

## Read-through trace

### (a) No rates available => IDR label, zero conversion (client + server), popup once

Client (`CurrencyProvider.buildContextValue`): with `rates = { IDR: 1 }` and a non-IDR
selection (say EUR), `selectedRate = Number(rates.EUR) = NaN`, so `hasRate = false`.
- `convertImport(amountIdr)` => `convertFromIdr(amountIdr, 1)` = raw IDR amount.
- `formatImport(amountIdr)` => `formatCurrency(amountIdr, "IDR")` = raw IDR number with the
  IDR suffix. Number and label agree.

This flows unchanged through every client consumer that reads the context:
- Card (`src/components/card/page.js`): `formatImport(minPrice)` etc. => IDR.
- Product detail (`SearchProductClient.jsx`): the import branch's `formatActivePrice` and the
  strike-through / discount / import-branch WhatsApp price all call `formatImport(amountIdr)`
  on raw-IDR inputs => IDR with an IDR label and no conversion. The local branch already uses
  `formatCurrency(amountIdr, "IDR")`.

Server (`currency.js`): on fetch failure `getIdrRateMap()` returns `{ IDR: 1 }`, so
`getIdrToUsdRate()` returns `null`, so `getImportConversionRate(locale)` returns `1` even for
a USD (en) locale. `resolveImportConversion` sees `rate === 1` => `importCurrency: "IDR"`.
`applyImportCurrency` / `applyImportCurrencyToProducts` therefore attach `importCurrency:
"IDR"` and `convertVariantImportPrices(variant, 1)` passes amounts through unchanged (rate 1
branch). SEO renderers (`ProductDetailPage.jsx`, `NewsDetailPage.jsx`) read
`product.importCurrency || "IDR"` => IDR for labels and JSON-LD `priceCurrency`. Zero
conversion, IDR everywhere.

Popup: the fetch effect sets `ratesUnavailable = true` only when the live fetch fails
(network throw, non-OK response, or no usable USD parsed) AND no fresh cache was used
(`markUnavailable` guards on `!hasFreshCache`). `CurrencyNotice` sees the false->true
transition (tracked via `previousUnavailable` ref) and shows exactly once.

### (b) Real rate present => single IDR->currency multiply, correct label, no popup

Client EUR trace: live fetch yields `parsed.EUR`, so `rates = { IDR: 1, ...parsed }` and
`selectedRate = rates.EUR > 0` => `hasRate = true`.
- `formatImport(amountIdr)` => `formatCurrency(convertFromIdr(amountIdr, rates.EUR), "EUR")`
  = a single `raw_IDR × rates.EUR` multiply, labeled EUR. One multiply, no double pass.

On a successful fetch the effect calls `setRatesUnavailable(false)`, so no popup fires.

Server USD trace: when a real USD rate exists, `getIdrToUsdRate()` returns it,
`getImportConversionRate("en")` returns that rate (!= 1), `resolveImportConversion` keeps
`importCurrency: "USD"`, and `convertVariantImportPrices` multiplies the raw IDR snapshots by
the rate. Raw-IDR snapshot fields (`importPriceIdr`/`importDozenPriceIdr`/`fromPriceIdr`) are
untouched by the edits.

### (c) Local price always IDR

The local branch in `SearchProductClient.jsx` and the local price fields (`price`,
`dozenPrice`) in `convertVariantImportPrices` are never converted; local always renders via
`formatCurrency(amountIdr, "IDR")`. Unchanged.

### (d) Per-language override and /api/currency-absent preserved

`CurrencyProvider` still uses the namespaced keys `ep.currency.id` / `ep.currency.en` with a
locale-reactive reselect effect (no cross-bleed), still caches `ep.rates` / `ep.ratesAt` for
1h, and still fetches `EXCHANGE_RATE_ENDPOINT` (Frankfurter) directly in the browser — no
in-app proxy route was added or referenced.

### (e) Popup is hydration-safe, accessible, dismissible, non-blocking

- Hydration-safe: `ratesUnavailable` starts `false` (matching SSR) and only flips inside a
  post-mount effect; `CurrencyNotice` returns `null` until `visible`, so the server render and
  first client paint are empty. No `window`/`localStorage` at module top level.
- Accessible: `role="status"` + `aria-live="polite"`, a labeled close button
  (`aria-label="Dismiss"`), keyboard-dismissible via the focusable button and the Escape key.
- Dismissible: manual close button + Escape, plus a ~7s auto-dismiss timer (cleared on
  unmount/dismiss). Shows once per failed load via the ref-tracked flag transition.
- Non-blocking & placement: fixed bottom-right (`z-index: 900`, below navbar's `1000`), no
  backdrop/overlay. The navbar (and its currency selector) is top-fixed, so a bottom-right
  toast never covers it. Responsive: at <=768px it spans with side margins and no overflow.
  Respects `prefers-reduced-motion`.

### (f) No FALLBACK_RATES remaining

Workspace regex search for `FALLBACK_RATES` across `src/**/*.{js,jsx}` returns no matches.

## Public signatures preserved

`convertFromIdr`, `getIdrRateMap`, `getIdrToUsdRate`, `getImportConversionRate`,
`applyImportCurrency`, `applyImportCurrencyToProducts`, `parseRatesFromPayload`,
`EXCHANGE_RATE_ENDPOINT`, `SUPPORTED_CURRENCIES`, `convertVariantImportPrices` all remain
exported with working signatures (`convertVariantImportPrices` and `resolveImportConversion`
are now exported; behavior unchanged).
