# Direct Frankfurter fetch, in-app `/api/currency` proxy removed

The change deletes the in-app `/api/currency` route handler and moves the browser's exchange-rate fetch straight to the public, CORS-enabled Frankfurter v2 API. `CurrencyProvider` now calls the absolute Frankfurter URL directly, parses the flat quote array into an IDR→X map through a shared pure helper, caches it in localStorage with a 1h TTL, and falls back to real IDR→X rates (never a silent ×1) on any failure. The server SEO path keeps its own direct server-side Frankfurter fetch in `src/lib/currency.js`, so SEO renderers never depended on the deleted route. Local price stays IDR, per-language override keys are preserved, and first paint uses the SSR locale default for hydration safety.

Watch for: nothing blocking — all six acceptance criteria verified against the code. (confirmed)

**Verdict**: APPROVED

## High-level view

The deletion is clean. A repo-wide grep for `/api/currency` across `src/**/*.{js,jsx}` returns zero matches and the `src/app/api/currency/` directory no longer exists in the tree, so no live code still points at the removed proxy.

The client/server split is the core of the design. Both sides fetch Frankfurter directly, but they are deliberately asymmetric: the server fetch in `fetchIdrRates()` passes `next: { revalidate: 3600 }` for Next's data cache, while the client fetch in the provider omits that server-only hint entirely. They share one pure parser (`parseRatesFromPayload`) and one fallback table (`FALLBACK_RATES`), so the two paths produce the same shape of IDR→X map without the client importing anything server-only.

Fallback behavior is fail-safe rather than fail-open. The provider seeds `{ IDR: 1, ...FALLBACK_RATES }` on mount, validates the fetched payload has a finite positive USD rate before accepting it, and layers `{ IDR: 1, ...FALLBACK_RATES, ...parsed }` so any symbol missing from the response resolves to a real rate instead of 1. A non-IDR currency therefore never displays an unconverted IDR amount under a foreign label.

Conversion stays a single multiply. `buildContextValue` resolves `activeRate = rates[currency]` from the Frankfurter map and `convertImport`/`formatImport` run `raw_IDR × activeRate` once. Local price fields are untouched, raw-IDR snapshots are preserved for the client, and per-locale override keys (`ep.currency.id` / `ep.currency.en`) are read and written per current locale with no cross-bleed.

## Issues (0)

No blocking or non-blocking findings. All six acceptance criteria pass.

<details>
<summary>Details</summary>

### Proxy route removal is complete

`file_search` for `src/app/api/currency` returns no files, confirming both the `route.js` and its directory are gone. `grep_search` for `/api/currency` across `src/**/*.{js,jsx}` returns no matches, so no source references the deleted endpoint. The only historical mentions live under `.agents/tasks/` documentation, which is out of scope. Criterion 1 passes (confirmed).

### Client fetches Frankfurter directly, server-only hint omitted

In `CurrencyProvider.jsx` the rate loader calls `await fetch(EXCHANGE_RATE_ENDPOINT)` with no second argument, so the server-only `next: { revalidate }` option is absent on the browser path. `EXCHANGE_RATE_ENDPOINT` is imported from `@/lib/currency` and resolves to the exact URL `https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur,gbp,sgd,myr,aud,jpy,cny`. The response is parsed by the exported `parseRatesFromPayload`, which walks the flat `[{ base, quote, rate }, ...]` array into an uppercase-keyed map. Rates are cached under `ep.rates` / `ep.ratesAt` with the `RATES_TTL_MS = 60 * 60 * 1000` (1h) TTL, read back on mount before any network call.

The fallback path is fail-safe: the loader validates `Number(parsed.USD)` is finite and positive before accepting the payload, returns early (keeping seeded/cached rates) on a non-OK response, bad payload, or thrown error, and merges `{ IDR: 1, ...FALLBACK_RATES, ...parsed }` so a missing symbol lands on a real IDR→X fallback rather than 1. Criterion 2 passes (confirmed).

### EUR traced end to end as a single multiply

`buildContextValue` sets `activeRate = rates?.[currency] ?? (currency === "IDR" ? 1 : FALLBACK_RATES[currency] ?? 1)`. For EUR, `rates.EUR` comes directly from the parsed Frankfurter map. `convertImport(amountIdr)` calls `convertFromIdr(amountIdr, activeRate)`, which is `Math.round(amount × rate × 100) / 100` — one multiply against the map value, no server pre-conversion and no `× 1` shortcut for a non-IDR currency. Criterion 3 passes (confirmed).

### Server SEO path is independent of the deleted route

`src/lib/currency.js` keeps `fetchIdrRates()` fetching Frankfurter server-side with `next: { revalidate: 3600 }`, feeding `getIdrRateMap()` (hourly in-memory cache plus in-flight dedupe) and the `applyImportCurrency*` helpers. This path never referenced `/api/currency`. A grep across `src/app/{product,news}/**/*.jsx` for `window`, `localStorage`, `useCurrency`, `parseRatesFromPayload`, and `EXCHANGE_RATE_ENDPOINT` shows the only hit is `useCurrency` inside `SearchProductClient.jsx` (the client island), not `ProductDetailPage.jsx` or `NewsDetailPage.jsx`. The SEO renderers stay on the locale default with no browser state. Criterion 4 passes (confirmed).

### Local price, per-language override, and public surface

`convertVariantImportPrices` leaves `price` / `dozenPrice` untouched and preserves `importPriceIdr` / `importDozenPriceIdr` / `fromPriceIdr` raw snapshots, so local price is always IDR and no double conversion occurs. Override storage is namespaced per locale via `getCurrencyStorageKey(locale)` → `ep.currency.id` / `ep.currency.en`; `setCurrency` writes only the current locale's key and the locale-change effect re-reads only that locale's stored value, so neither language bleeds into the other. First paint uses `getDefaultCurrencyForLocale(locale)` (SSR locale default) with the override reconciled in a post-mount effect, keeping hydration safe. The provider imports only pure client-safe values (`EXCHANGE_RATE_ENDPOINT`, `FALLBACK_RATES`, `SUPPORTED_CURRENCIES`, `convertFromIdr`, `getDefaultCurrencyForLocale`, `parseRatesFromPayload`) — nothing server-only. Public signatures `convertFromIdr` / `getIdrRateMap` / `getIdrToUsdRate` / `getImportConversionRate` / `applyImportCurrency*` are all present and intact in `currency.js`. Criterion 5 passes (confirmed).

### Build evidence accepted

The coder's trace in `currency-direct-frankfurter.md` records `npm run build` reaching `✓ Compiled successfully in 2.4s` with exit code 0, full page generation (16/16), and no `/api/currency` in the route table. Per instruction the build was not re-run. The run completed without the pre-existing Prisma prerender error this time; had it appeared it would still count as a PASS per the environmental note. No new compile/import/hydration/SSR error is reported. Criterion 6 passes (confirmed).

</details>

<details>
<summary>File map</summary>

- `src/app/api/currency/route.js` — deleted (proxy route removed).
- `src/components/currencyProvider/CurrencyProvider.jsx` — client fetches Frankfurter directly, parses, caches, fail-safe fallback.
- `src/lib/currency.js` — `EXCHANGE_RATE_ENDPOINT` and `parseRatesFromPayload` now exported; server-side `fetchIdrRates`/`getIdrRateMap` unchanged in behavior.
- `src/components/navbar/page.js` — currency selector wired to provider (`useCurrency`).
- `src/app/product/[productId]/ProductDetailPage.jsx`, `src/app/news/[slug]/NewsDetailPage.jsx` — unchanged, SEO on locale default.

Full diff: `git diff v-6.0`.

</details>
