# Implementation Plan — Navbar Currency Selector

All paths are absolute under the worktree:
`d:\react project in SSD\Eksotika Prima\eksotika-prima-next\.worktrees\currency-selector`.
Your cwd is the parent workspace, so always write files under that worktree path, never a bare `src/...`.

## Context discovered during exploration (read before editing)

- Project: Next.js 16 App Router, JavaScript (NOT TypeScript), React 19. 2-space indent, double quotes, `@/` import alias. ES modules (`"type": "module"`).
- No test framework is installed (only `node_modules` carry tests). The only real verification commands are:
  - `npm run lint` (eslint via `next lint`)
  - `npm run build` (`next build`) — the authoritative check; it compiles every route and will fail on SSR/import/hydration-level errors.
  - Manual dev check: `npm run dev`, then exercise the UI. There is no unit runner, so logic correctness is verified by `npm run build` passing plus a short manual script described per item.
- Current price flow: prices are stored in IDR in the DB. `src/lib/currency.js` converts import prices to the LOCALE default currency server-side (id→IDR, en→USD) and **overwrites** `variant.importPrice`, `variant.importDozenPrice`, `variant.fromPrice`, preserving the original IDR `fromPrice` only as `variant.fromPriceLocal`. It attaches `product.importCurrency`. **The raw IDR import numbers are lost on the client today** — this is the central problem.
- Frankfurter v2 decision (VERIFIED by live fetch of `https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur,gbp`): the `quotes` param DOES accept a comma-separated list, and the response is a FLAT ARRAY of `{ "date", "base", "quote", "rate" }` objects (one per quote, dates may differ per currency). So we query `?base=idr&quotes=usd,eur,gbp,sgd,myr,aud,jpy,cny` in ONE call and parse the array into a `{ USD: rate, EUR: rate, ... }` map. The existing `parseRateFromPayload` already iterates this array shape for USD; we generalize it. IDR is not requested (rate is always 1).

## Chosen data field shape (so NO renderer loses its raw IDR number)

Server conversion is KEPT for SEO stability, and raw IDR values are added alongside it. After `applyImportCurrency*`, each variant carries:

- `importPrice`, `importDozenPrice`, `fromPrice` — locale-default-converted values (UNCHANGED behavior). Server renderers (ProductDetailPage metadata/JSON-LD, NewsDetailPage `getProductPrice`) keep reading these → crawlers see stable locale-default prices.
- `product.importCurrency` — locale default currency label (UNCHANGED). Server renderers keep using it.
- `fromPriceLocal` — raw IDR `fromPrice` (ALREADY exists; keep it).
- NEW raw-IDR fields (never overwritten): `importPriceIdr`, `importDozenPriceIdr`, `fromPriceIdr`. These are the pre-conversion IDR numbers. `importPriceIdr` falls back to `price` (IDR local price) when there is no distinct import price, mirroring the existing `variant.importPrice || variant.price` reads.

Client renderers IGNORE the pre-converted `importPrice`/`importCurrency` and instead convert the `*Idr` fields live via the currency context. Local-price branches keep reading `variant.price` / `variant.dozenPrice` / `fromPriceLocal` (always IDR) — unchanged.

Supported display currencies: `["IDR","USD","EUR","GBP","SGD","MYR","AUD","JPY","CNY"]`. Locale default: id→IDR, en→USD. Whole-unit (0 decimals): IDR and JPY; others up to 2 decimals.

---

- [ ] 1. Extend `src/lib/currency.js`: supported list, per-locale default, multi-currency Frankfurter fetch, client-safe helpers, and raw-IDR field preservation.
      Add `export const SUPPORTED_CURRENCIES = ["IDR","USD","EUR","GBP","SGD","MYR","AUD","JPY","CNY"]`. Add `getDefaultCurrencyForLocale(locale)` returning `getImportCurrency(locale)` (id→IDR, en→USD) — reuse the existing `importCurrencyByLocale` map (extend it only if you prefer a dedicated name; the mapping is identical). Change `EXCHANGE_RATE_ENDPOINT` to request all non-IDR symbols: `https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur,gbp,sgd,myr,aud,jpy,cny`. Rewrite `parseRateFromPayload` into `parseRatesFromPayload(payload)` that walks the flat array and returns a map `{ USD, EUR, ... }` (uppercase keys, numeric rates), tolerant of the legacy `{rates:{...}}` object shape. Add a per-currency `FALLBACK_RATES` map (keep `0.000056` for USD; add sensible IDR→X fallbacks for the others) used when the API is unreachable or a symbol is missing. Rename the hourly cache to hold the whole rate map (`cachedRates`), keeping the same TTL + in-flight-dedupe pattern; add `getIdrRateMap()` returning `{ IDR: 1, ...fetched }`. Keep `getIdrToUsdRate()` working (derive from the map) so no caller breaks. Add client-safe pure helpers: `convertFromIdr(amountIdr, rate)` (returns `amount * rate`, rounds to 2 decimals, passes through non-finite/null) and `getCurrencyFractionDigits(currency)` (0 for IDR/JPY, else 2). In `convertVariantImportPrices`, ADD the raw-IDR fields before converting: set `importPriceIdr = variant.importPrice ?? variant.price`, `importDozenPriceIdr = variant.importDozenPrice`, `fromPriceIdr = variant.fromPrice` (capture these from the ORIGINAL variant, i.e. before overwrite). Leave the existing conversion/overwrite of `importPrice`/`importDozenPrice`/`fromPrice` and `fromPriceLocal` exactly as-is. Keep `getImportConversionRate`/`applyImportCurrency*` signatures unchanged.
      Files: `src/lib/currency.js`
      Verify: `npm run build` compiles with no errors. Manual: in `npm run dev`, hit `http://localhost:3000/en/product/<id>` and confirm the page still renders a USD import price (server path unchanged); temporarily `console.log(getIdrRateMap())` in a server component or the route from item 2 and confirm it logs a 8-entry map with finite positive rates.

- [ ] 2. Add a client-facing exchange-rate endpoint.
      Create `src/app/api/currency/route.js` ('use server' route handler) exporting `GET` that calls `getIdrRateMap()` from `@/lib/currency` and returns `Response.json({ base: "IDR", rates: <map including IDR:1>, supported: SUPPORTED_CURRENCIES })`. Set `export const revalidate = 3600` so Next caches it hourly (matches the lib TTL). Do not read cookies/localStorage; this is pure server data.
      Files: `src/app/api/currency/route.js`
      Verify: `npm run build` succeeds. Manual: `npm run dev`, `GET http://localhost:3000/api/currency` returns JSON with `rates.USD` finite and `rates.IDR === 1` and a 9-item `supported` array.

- [ ] 3. Add the currency-selector aria-label string to BOTH locales.
      In `src/lib/i18n.js`, add `currencyLabel` to the `nav` section of BOTH `id` ("Pilih mata uang") and `en` ("Choose currency") dictionaries, next to `languageLabel`.
      Files: `src/lib/i18n.js`
      Verify: `npm run build` succeeds. Manual: `getTranslations("en").nav.currencyLabel === "Choose currency"`.

- [ ] 4. Create the client CurrencyProvider context.
      Create `src/components/currencyProvider/CurrencyProvider.jsx` ('use client'). Export a React context + `CurrencyProvider` component + `useCurrency()` hook. State: `currency` and `rates` (IDR→X map). SSR-safe init — to avoid hydration mismatch, FIRST paint MUST use the locale default: initialize `currency` state to `getDefaultCurrencyForLocale(getLocaleFromPathname(usePathname()||"/"))` (derive locale with the SAME i18n helpers the navbar uses), and only AFTER mount (in a `useEffect`, guarded by `typeof window !== "undefined"`) read `localStorage.getItem("ep.currency")`; if present and in `SUPPORTED_CURRENCIES`, set it. On mount, also load rates: read cached `ep.rates` + `ep.ratesAt` from localStorage; if fresh (< 1h) use them, otherwise `fetch("/api/currency")`, store `rates`/timestamp in localStorage, and set state. Provide `setCurrency(next)` that updates state and writes `localStorage.setItem("ep.currency", next)`. Expose via context value: `{ currency, setCurrency, rates, supportedCurrencies, convertImport(amountIdr), formatImport(amountIdr) }` where `convertImport` uses `convertFromIdr(amountIdr, rates[currency] ?? 1)` and `formatImport` formats the converted amount with `formatCurrency(converted, currency)` from i18n (which already respects fraction digits; confirm JPY/IDR render whole-unit — `formatCurrency` uses `maximumFractionDigits: currency === "IDR" ? 0 : 2`, so EXTEND `formatCurrency` in `src/lib/i18n.js` to treat `JPY` as 0 decimals too, OR have `formatImport` call `getCurrencyFractionDigits`; pick extending `formatCurrency` to add `JPY` to the whole-unit branch — one line, keeps all callers correct). Default `useCurrency` return when no provider is present should be a safe no-op (currency "IDR", identity convert) so server-imported-but-unmounted cases never throw.
      Files: `src/components/currencyProvider/CurrencyProvider.jsx`, `src/lib/i18n.js` (JPY whole-unit tweak in `formatCurrency`)
      Verify: `npm run build` succeeds (no window access at module/render top level). Manual in item 7's end-to-end check.

- [ ] 5. Mount the provider in the root layout.
      In `src/app/layout.js`, import `CurrencyProvider` and wrap the existing children: `<CurrencyProvider><Navbar/><div className="page-layout">{children}</div><Footer/></CurrencyProvider>` inside `.app-container`. The provider is a client component; `layout.js` stays a server component (client children are allowed). Keep `suppressHydrationWarning` on `<html>`.
      Files: `src/app/layout.js`
      Verify: `npm run build` succeeds. Manual: every page still renders Navbar/Footer; no console hydration error on first load.

- [ ] 6. Add the currency `<select>` to the navbar next to the logo.
      In `src/components/navbar/page.js`, import `useCurrency` and render an accessible `<select className="navbar-currency">` immediately AFTER the `navbar-logo` `<Link>` (still inside `.navbar-box`, before `.navbar-menu`). Bind `value={currency}` and `onChange={(e)=>setCurrency(e.target.value)}`, give it `aria-label={text.currencyLabel}`, and map `supportedCurrencies` to `<option value={c}>{c}</option>`. It is natively keyboard-usable. Do not gate it behind the mobile menu toggle — it must stay visible beside the logo on mobile.
      Files: `src/components/navbar/page.js`
      Verify: `npm run build` succeeds. Manual: dropdown appears beside the logo on desktop AND at ≤768px width; changing it does not reload the page.

- [ ] 7. Style the selector in the navbar CSS for desktop and mobile.
      In `src/components/navbar/page.css`, add `.navbar-currency` rules so it sits beside the logo (small, readable, matches the green navbar — e.g. compact padding, border, white/dark text). Add an entry in the existing `@media (max-width: 768px)` block so it stays visible and tappable when `.navbar-logo-name` is hidden and `.menu-icon` shows (the select is a direct child of `.navbar-box`, NOT inside `.navbar-menu`, so it is unaffected by the menu's `opacity:0` collapse — confirm it still shows when the hamburger menu is closed). Keep it from overflowing the 95%-width `.navbar-box` on narrow screens.
      Files: `src/components/navbar/page.css`
      Verify: `npm run build` succeeds. Manual: resize to 375px — logo image + currency select + hamburger all visible on one row; open/close menu does not hide the select.

- [ ] 8. Make the product Card render live in the selected currency.
      Convert `src/components/card/page.js` to a client component (add `'use client'`) and use `useCurrency()`. Compute `minPrice/maxPrice` from the RAW IDR fields: `variant.importPriceIdr ?? variant.price`; compute `minFromPrice/maxFromPrice` from `variant.fromPriceIdr ?? variant.fromPrice`. Compute `discountPercentage` from the IDR numbers (ratio is currency-independent, so compute it on IDR to avoid rounding drift). Replace every `formatCurrency(x, importCurrency)` with `formatImport(xIdr)` from context so both the price range and strike-through from-price display in the selected currency and update live. Keep the `DiscountBadge` and markup otherwise identical. (`Card` is rendered by `CardLoadClient` which is already a client component, so making `Card` a client component is clean and avoids prop drilling.)
      Files: `src/components/card/page.js`
      Verify: `npm run build` succeeds. Manual: on `/product`, change the navbar currency and confirm EVERY card's price + from-price switch currency instantly with no reload; discount % stays stable across currencies.

- [ ] 9. Make the product detail client view use the selected currency for the import branch (local stays IDR, incl. WhatsApp message).
      In `src/app/product/[productId]/SearchProductClient.jsx`, use `useCurrency()`. Change `getVariantPrice` import-branch reads to the raw IDR fields (`variant.importPriceIdr ?? variant.price` for single, `variant.importDozenPriceIdr` for dozen); the local branch keeps `variant.price`/`variant.dozenPrice` (IDR) unchanged. Keep `selectedPrice` as the raw IDR amount internally. For DISPLAY: when `priceType === "import"`, format the price, the strike-through `fromPriceTotal`, and the WhatsApp `selectedPriceText` with `formatImport(amountIdr)` (converting the IDR total); when `priceType === "local"`, keep `formatCurrency(amount, "IDR")` as today. Base `activeFromPrice` on `fromPriceIdr` for the import branch and `fromPriceLocal` for the local branch. Compute `discountPercentage` from IDR totals (currency-independent). Ensure the WhatsApp `buyMessage` price reflects the active selected currency for the import branch and stays IDR for local. Guard against SSR: `useCurrency` must return safe defaults before mount so first paint uses locale default (provider handles this).
      Files: `src/app/product/[productId]/SearchProductClient.jsx`
      Verify: `npm run build` succeeds. Manual on `/en/product/<id>`: switch navbar currency → import price, strike-through, discount %, and the WhatsApp link's `text=` price all reflect the chosen currency; toggle to "Local Price" → price shows IDR regardless of selector; discount % consistent.

- [ ] 10. Confirm server-rendered SEO stays on the locale default (no code change expected; verification item).
      ProductDetailPage.jsx (metadata twitter price, `product:price:*`, JSON-LD `offers`) and NewsDetailPage.jsx `getProductPrice` continue to read `product.importCurrency` + the pre-converted `importPrice`/`importDozenPrice`. Since items 1–9 did NOT change the server conversion path or these fields, server output must be unchanged. Do NOT add any client/localStorage read to these server files.
      Files: none (verification only — if any item above accidentally altered the server fields, fix it here).
      Verify: `npm run build` succeeds. Manual: `curl` (or view-source) `http://localhost:3000/en/product/<id>` and confirm the `application/ld+json` `offers.priceCurrency` is `USD` and `/product/<id>` (id) is `IDR`, independent of any browser currency selection (server has no access to it). Same for a news detail page's related-product price text.

- [ ] 11. Final full-site verification pass.
      Files: none.
      Verify: `npm run lint` passes (or only shows pre-existing warnings), then `npm run build` completes successfully. Manual smoke in `npm run dev`: (a) first load shows locale-default currency with no hydration warning; (b) pick EUR → reload page → still EUR (localStorage persistence); (c) switch language id↔en without a stored choice resets to that locale's default, but a stored choice overrides it; (d) local price always IDR; (e) cards, product detail, and WhatsApp message all reflect the selection live.

## Notes / assumptions

- No unit-test runner exists; `npm run build` + `npm run lint` are the automated gates, with per-item manual dev-server checks as specified. If a test runner is added later, port the currency-math checks (`convertFromIdr`, fraction digits, rate-map parse) into it.
- Fallback IDR→X rates in item 1 are approximations for offline resilience only; they are superseded by live Frankfurter data whenever reachable.
- localStorage keys chosen: `ep.currency`, `ep.rates`, `ep.ratesAt`. Adjust names if a project convention surfaces, but keep them namespaced.
