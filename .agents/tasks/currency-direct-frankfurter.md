# Direct Frankfurter fetch: remove in-app `/api/currency` proxy

## What changed

The navbar currency selector no longer depends on an in-app currency API. The
client now fetches exchange rates **directly** from the public Frankfurter API,
and the intermediary route handler has been deleted.

### 1. Deleted the in-app proxy route

- `git rm src/app/api/currency/route.js` (staged deletion).
- The `src/app/api/currency/` folder is empty and gone from the source tree.
- Repo-wide grep for `/api/currency` across `src/**/*.{js,jsx}` returns **no**
  remaining source references. The only other hits are historical notes under
  `.agents/tasks/` (documentation, not code).
- The production build route table no longer lists `/api/currency`.

### 2. Client fetches Frankfurter directly (`CurrencyProvider.jsx`)

The rate loader effect now calls:

```js
const response = await fetch(EXCHANGE_RATE_ENDPOINT);
```

`EXCHANGE_RATE_ENDPOINT` is the absolute Frankfurter URL
`https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur,gbp,sgd,myr,aud,jpy,cny`,
imported from `@/lib/currency`. The browser fetch deliberately omits the
server-only `next: { revalidate }` option — that hint is used only by the
server-side `fetchIdrRates()` in `src/lib/currency.js`.

The response (a flat array of `{ base, quote, rate }` objects) is parsed by the
shared, now-exported `parseRatesFromPayload(payload)` into an uppercase-keyed
map. The provider then builds `{ IDR: 1, ...FALLBACK_RATES, ...parsed }` so:

- IDR is always the base (rate 1), and
- any symbol missing from the response falls back to a real IDR→X rate rather
  than silently multiplying by 1.

The result is written to state and cached in `localStorage` under `ep.rates` /
`ep.ratesAt` with the existing 1-hour TTL. On a non-OK response, a bad payload
(no finite positive USD rate), or a thrown error, the loader returns early and
keeps the current (locale-default seeded or cached) rates — the pre-existing
fallback behavior.

### 3. Server SEO path unchanged

`src/lib/currency.js` still fetches Frankfurter **directly server-side** via
`fetchIdrRates()` → `getIdrRateMap()` with hourly caching, feeding
`applyImportCurrency*`. This path never depended on the deleted route, so SEO
locale-default conversion in `ProductDetailPage.jsx` / `NewsDetailPage.jsx`
continues to work. Those files were not touched.

### 4. New exports in `src/lib/currency.js`

- `EXCHANGE_RATE_ENDPOINT` — was module-private, now exported (pure string).
- `parseRatesFromPayload` — was module-private, now exported (pure function).

`SUPPORTED_CURRENCIES` and `FALLBACK_RATES` were already exported. All four are
pure, client-safe values/functions; nothing server-only (fetch caching hints,
secrets) leaks into the client bundle.

## Read-through trace

1. **Client hits Frankfurter directly, not `/api/currency`.** The provider's
   rate effect calls `fetch(EXCHANGE_RATE_ENDPOINT)` where the endpoint is the
   absolute `api.frankfurter.dev` URL. No `/api/currency` reference remains in
   `src/`.
2. **EUR conversion is a single IDR→EUR multiply.** `buildContextValue` sets
   `activeRate = rates?.[currency] ?? (currency === "IDR" ? 1 : FALLBACK_RATES[currency] ?? 1)`.
   For EUR, `rates.EUR` comes straight from the parsed Frankfurter map
   (≈ 5.0e-05). `convertImport(amountIdr)` → `convertFromIdr(amountIdr, activeRate)`
   → `round(amountIdr × activeRate × 100)/100`. A 50,000 IDR item displays
   EUR 2.50 — one multiply from the map value, no `× 1` shortcut and no server
   pre-conversion.
3. **Server SEO still has rates.** `getIdrRateMap()` / `fetchIdrRates()` fetch
   Frankfurter server-side with hourly caching, independent of the deleted
   route; `applyImportCurrency*` consume that map.
4. **Local price stays IDR.** Variant `price` / `dozenPrice` are left untouched
   in `convertVariantImportPrices`; only import fields are converted.
5. **Per-language override intact.** Storage keys remain `ep.currency.id` /
   `ep.currency.en`, reselected reactively on `[locale]` change with no
   cross-bleed; first paint uses the locale default for hydration safety.
6. **Raw-IDR fields untouched.** `importPriceIdr` / `importDozenPriceIdr` /
   `fromPriceIdr` preservation in `convertVariantImportPrices` is unchanged, so
   no double conversion.

## CORS

Frankfurter is a public, CORS-enabled API. A direct GET to
`https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur` returns the
expected flat array (e.g. `[{ "base":"IDR","quote":"EUR","rate":5.0e-05 }, ...]`),
confirming the client-side direct fetch is viable. No proxy route is needed.

## Build result

`npm run build` from the repo root:

```
✓ Compiled successfully in 2.4s
  Running TypeScript ... Finished TypeScript in 3ms
  Collecting page data ...
  Generating static pages (16/16)
  Finalizing page optimization ...
```

Exit code **0**. The route table no longer contains `/api/currency`. This run
completed page generation cleanly (no Prisma error surfaced this time); had the
pre-existing Prisma `PrismaClientInitializationError` appeared at the prerender
phase, it would still count as a PASS per the task's environmental note.
`npm run lint` is non-functional in Next 16 (removed `next lint`) and was not
treated as a gate.
