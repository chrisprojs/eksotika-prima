# Implementation Plan — Currency: no-fallback IDR + "unable to fetch rate" popup

Two-part scoped change. Part A removes guessed conversions (drop `FALLBACK_RATES`) so an
unavailable rate shows the raw IDR amount with an IDR label on both server and client.
Part B adds a beautiful, non-blocking, dependency-free popup when the client-side Frankfurter
fetch fails with no fresh cache.

## Context discovered during exploration (ground truth)

- Build/verify command: `npm run build` from repo root. PASS = reaching
  `✓ Compiled successfully`. A Prisma `PrismaClientInitializationError` during
  "Collecting page data"/prerender (remote libsql Turso `DATABASE_URL`, no live DB) is
  PRE-EXISTING and NOT a failure. `npm run lint` is non-functional (Next 16 removed
  `next lint`) — do not rely on it.
- `formatCurrency(price, currency)` in `src/lib/i18n.js` always appends the `currency`
  string as a visible suffix label. So number/label agreement is purely a matter of which
  currency string is passed. For IDR it uses 0 fraction digits.
- Server consumers of the lib:
  - `src/app/api/products/productService.js` calls `applyImportCurrencyToProducts(..., locale)`
    and `applyImportCurrency(..., locale)` — these internally call `resolveImportConversion(locale)`.
  - `src/app/api/news/newsService.js` calls `getImportCurrency(locale)` and
    `getImportConversionRate(locale)` SEPARATELY, then passes `{ rate, importCurrency }` to
    `applyImportCurrencyToProducts`. This separate-call path is the one that can desync the
    label from the rate, so it must be switched to a combined resolver (see item 2).
  - SEO renderers `ProductDetailPage.jsx` and `NewsDetailPage.jsx` read
    `product.importCurrency` (defaulting to `"IDR"`) for labels and JSON-LD `priceCurrency`.
    They need NO edits: once the lib attaches `importCurrency: "IDR"` when no real conversion
    happened, they render IDR naturally.
- Client consumers of `useCurrency()`: `src/components/card/page.js` and
  `src/app/product/[productId]/SearchProductClient.jsx` use `formatImport`/`convertImport`
  from the context. They need NO edits — the fix lives entirely in `buildContextValue`.
- `getImportCurrency`, `getIdrRateMap`, `getIdrToUsdRate`, `getImportConversionRate`,
  `applyImportCurrency`, `applyImportCurrencyToProducts`, `parseRatesFromPayload`,
  `EXCHANGE_RATE_ENDPOINT`, `SUPPORTED_CURRENCIES`, `convertVariantImportPrices`,
  `convertFromIdr` must all remain exported with working signatures.
- Styling convention: co-located `page.css`, className-based, no CSS-in-JS/Tailwind.
  Navbar green brand: `linear-gradient(135deg, #4edf00, #b0e57c)`, white text, rounded
  corners, `box-shadow: 0 4px 8px rgba(0,0,0,0.2)`, font vars `--var-font-family`,
  `--var-font-bold`. Navbar is `position: fixed; top: 0; height: 80px; z-index: 1000`.
- There is NO `convertVariantImportPrices` export today (it is an internal function). The
  task's PRESERVE list names it among "public signatures"; keep it defined, and if a test
  of signatures is desired, export it (currently internal — leaving it internal does not
  change behavior, but to honor the preserve list, add `export` to its declaration).

---

# Implementation Plan

- [ ] 1. Remove `FALLBACK_RATES` and all guessed conversion from `src/lib/currency.js`; make
      the only always-present rate `IDR: 1`.
      Delete the `FALLBACK_RATES` constant (and its comment block). In `getIdrRateMap`, build
      the success map as `{ IDR: 1, ...fetched }` (no fallbacks) and the failure/catch map as
      `cachedRates || { IDR: 1 }`. In `getIdrToUsdRate`, when `rates.USD` is not a finite
      positive number, `return null` (signal "no rate") instead of `FALLBACK_RATES.USD`.
      Files: src/lib/currency.js
      Verify: part of the item-4 build; also `npm run build` must still reach
      `✓ Compiled successfully` with no `FALLBACK_RATES is not defined` reference errors.

- [ ] 2. Make the server label agree with whether a real conversion happened, via one combined
      resolver. Change `getImportConversionRate(locale)` so that for a USD locale it awaits
      `getIdrToUsdRate()` and, when that is `null`/not finite-positive, returns `1` (no
      conversion). Add/confirm a single `resolveImportConversion(locale)` that returns
      `{ rate, importCurrency }` where `importCurrency` is forced to `"IDR"` whenever the
      effective `rate === 1` (i.e. no real conversion), otherwise `getImportCurrency(locale)`.
      Then update BOTH callers that currently resolve rate and label separately
      (`src/app/api/news/newsService.js`: `applyImportCurrencyToNewsList`, the single-news
      path near line 249, and any other site that pairs `getImportCurrency` +
      `getImportConversionRate`) to instead call the exported combined resolver so the label
      cannot desync from the rate. Keep `getImportCurrency` exported and unchanged in meaning
      (locale default label); keep `getImportConversionRate` exported.
      Files: src/lib/currency.js, src/app/api/news/newsService.js
      Verify: part of item 4. Manual trace: USD locale with USD rate present => rate = real,
      label USD; USD locale with USD rate missing => rate 1, label IDR; id locale => rate 1,
      label IDR (unchanged).

- [ ] 3. Export `resolveImportConversion` and `convertVariantImportPrices` from
      `src/lib/currency.js` (add `export` to their declarations) so the preserved public
      signature set is intact and item 2's callers can import the combined resolver. Confirm
      `applyImportCurrency` / `applyImportCurrencyToProducts` still route through
      `resolveImportConversion` so the IDR-when-no-rate label applies to the product path too.
      Raw-IDR snapshot fields (`importPriceIdr`/`importDozenPriceIdr`/`fromPriceIdr`) in
      `convertVariantImportPrices` must be unchanged.
      Files: src/lib/currency.js
      Verify: part of item 4; grep confirms no remaining `FALLBACK_RATES` references
      (`grep` only as a sanity check, not as the acceptance gate):
      `rg -n "FALLBACK_RATES" src` returns nothing.

- [ ] 4. Build-verify the server-side (Part A) changes.
      Files: (no new edits — verification step for items 1-3)
      Verify: `npm run build` reaches `✓ Compiled successfully`. The only acceptable error is
      the pre-existing Prisma `PrismaClientInitializationError` at the data-collection/prerender
      phase. Any compile/reference error (e.g. leftover `FALLBACK_RATES`) is a real failure to fix.

- [ ] 5. Update `src/components/currencyProvider/CurrencyProvider.jsx` to drop fallbacks and
      do the missing-rate IDR path. Remove the `FALLBACK_RATES` import and the
      `DEFAULT_RATES = { IDR: 1, ...FALLBACK_RATES }` seed; replace with
      `const DEFAULT_RATES = { IDR: 1 }`. In `buildContextValue`, compute
      `const hasRate = currency === "IDR" || (Number.isFinite(Number(rates?.[currency])) && Number(rates[currency]) > 0);`
      then `convertImport(amountIdr)` returns `convertFromIdr(amountIdr, hasRate ? rates[currency] : 1)`
      — but when `!hasRate`, treat as IDR: return the raw IDR amount. `formatImport(amountIdr)`
      must use the IDR label when `!hasRate`:
      `return hasRate ? formatCurrency(convertFromIdr(amountIdr, rates[currency]), currency) : formatCurrency(amountIdr, "IDR");`
      In the fetch effect, build `nextRates` as `{ IDR: 1, ...parsed }` (no fallbacks). Update
      the `useCurrency()` no-provider defaults' `rates` to `{ IDR: 1 }`. First paint stays on
      the locale default with only `IDR: 1` known, so a non-IDR default briefly shows IDR until
      rates arrive — accepted; do NOT add a seed to mask it.
      Files: src/components/currencyProvider/CurrencyProvider.jsx
      Verify: part of item 9. Trace EUR with a real rate present: `formatImport` yields
      `raw_IDR × rates.EUR` labeled EUR (regression-protected). Trace selected currency with no
      rate: shows raw IDR labeled IDR.

- [ ] 6. Add a `ratesUnavailable` boolean to the provider context, SSR/hydration-safe. Add
      `const [ratesUnavailable, setRatesUnavailable] = useState(false);` (starts false so the
      server render and first client paint match). In the fetch effect: on a FRESH cache hit
      keep it false; when starting a live fetch track whether a fresh cache existed; set
      `setRatesUnavailable(true)` ONLY when the live fetch fails (network throw, non-OK
      response, or no usable `USD` rate parsed) AND there was no fresh cached map to fall back
      to; call `setRatesUnavailable(false)` on a successful fetch that sets real rates. Include
      `ratesUnavailable` in the object returned by `buildContextValue` (thread it through as a
      parameter) and in the `useCurrency()` no-provider defaults (`ratesUnavailable: false`).
      Guard every `window`/`localStorage` access with `typeof window !== "undefined"` inside
      effects (already the pattern). The flag must never be true during server render.
      Files: src/components/currencyProvider/CurrencyProvider.jsx
      Verify: part of item 9; manual trace of the three fetch outcomes above.

- [ ] 7. Create the dependency-free, accessible, on-brand popup component.
      Create `src/components/currencyNotice/CurrencyNotice.jsx` (`"use client"`): reads
      `const { ratesUnavailable } = useCurrency();`. Keeps local `visible` state. In an effect
      keyed on `ratesUnavailable`, when it flips to true set `visible = true` and start a
      ~7s auto-dismiss timer (cleared on unmount/dismiss); show once per failed load (do not
      re-fire on every render — gate on the flag transition, e.g. a `useRef` of the last seen
      value). Render `null` when not visible (so it is absent on the server and on first paint).
      Markup: a corner toast container with `role="status"` and `aria-live="polite"`, a title
      "Exchange rate unavailable", a line "We couldn't load live exchange rates, so prices are
      shown in IDR.", a small green accent/icon, and a labeled close button
      (`aria-label="Dismiss"`, textual ×) that is keyboard-focusable and also dismissible via
      Escape. Create `src/components/currencyNotice/page.css` matching the repo convention:
      rounded corners, soft shadow (`0 4px 8px rgba(0,0,0,0.2)` family), subtle slide/fade-in
      keyframe animation, green accent from the navbar palette (`#4edf00`/`#b0e57c`), readable
      contrast, fixed to a corner that does NOT overlap the fixed navbar currency selector
      (e.g. bottom-right, `z-index` below navbar's 1000 or clearly out of its area; since
      navbar is top-fixed, bottom-right is safe), non-blocking (no overlay/backdrop), and
      responsive at ≤768px (constrained width, no overflow). Class names follow the
      `currency-notice-*` / BEM-ish style used across the repo.
      Files: src/components/currencyNotice/CurrencyNotice.jsx, src/components/currencyNotice/page.css
      Verify: part of item 9 build; manual: component imports resolve, no `window` access at
      module top level.

- [ ] 8. Mount `CurrencyNotice` inside the provider subtree in `src/app/layout.js`. Import it
      and render it inside `<CurrencyProvider>` (e.g. right after `<Footer />`, still within the
      provider so `useCurrency()` resolves), keeping the existing Navbar/children/Footer order.
      Because it renders `null` unless `ratesUnavailable` && visible, the server render is
      unchanged and hydration-safe.
      Files: src/app/layout.js
      Verify: part of item 9; manual: layout still renders provider > Navbar > page-layout >
      Footer, with CurrencyNotice inside the provider.

- [ ] 9. Final build-verify of the whole change (Parts A + B).
      Files: (verification step for items 5-8)
      Verify: `npm run build` reaches `✓ Compiled successfully` (pre-existing Prisma prerender
      error is the only acceptable error). Then confirm each acceptance criterion below.

---

## Acceptance criteria mapping (6)

1. No hardcoded fallbacks remain: `FALLBACK_RATES` deleted from `currency.js` and its import
   removed from `CurrencyProvider.jsx`; `rg -n "FALLBACK_RATES" src` returns nothing (items 1,3,5).
2. On fetch failure the rate map is exactly `{ IDR: 1 }` on both server (`getIdrRateMap`
   catch/no-cache) and client (`DEFAULT_RATES`, `nextRates` on no usable parse) — items 1,5,6.
3. Missing rate => no conversion with IDR label: client `buildContextValue` returns raw IDR via
   `formatCurrency(amountIdr, "IDR")` when the selected currency has no finite-positive rate;
   server `resolveImportConversion` forces `importCurrency: "IDR"` when effective rate is 1
   (items 2,3,5). `getIdrToUsdRate` returns `null` when no USD rate (item 1).
4. Real rate still converts and labels correctly: EUR/USD with a present rate yields
   `raw_IDR × rate` with the selected-currency label on the client, and USD on the server when
   a real USD rate exists (items 2,5). Raw-IDR snapshots and local-always-IDR behavior unchanged.
5. Beautiful, accessible, non-blocking, once-per-failure popup wired to `ratesUnavailable`,
   mounted app-wide inside the provider, SSR/hydration-safe (flag starts false, flips only
   post-mount) — items 6,7,8.
6. Build passes: `npm run build` reaches `✓ Compiled successfully`; the only tolerated error is
   the pre-existing Prisma prerender `PrismaClientInitializationError` (items 4,9).

## Assumptions / notes

- Popup position chosen bottom-right because the navbar is top-fixed; this guarantees it never
  covers the currency selector or nav controls. If a different corner is preferred, only
  `page.css` positioning changes.
- `convertVariantImportPrices` is currently internal; adding `export` honors the "keep public
  signatures working" list without behavior change. If the reviewer prefers it internal, the
  only requirement is that it keeps working — exporting is the safe reading of the task.
- No new dependencies are added; the popup is a plain React component + CSS, per constraints.
