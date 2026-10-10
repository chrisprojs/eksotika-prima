# Implementation Plan — News "Related products" live currency conversion

## Goal

The "Related products" aside on the news detail page (`/[locale]/news/[slug]`) renders prices server-side from pre-converted `variant.importPrice` labeled with `product.importCurrency`. These ignore the navbar currency selector (GBP stays USD on `/en`). Convert the VISIBLE price live to the selected currency, matching the product `Card` pattern, WITHOUT touching the server SEO (JSON-LD / metadata / twitter) which must stay on the locale default.

## Findings from exploration (confirmed by reading code)

- **Visible price source:** `src/app/news/[slug]/NewsDetailPage.jsx` → `getProductPrice(product, locale, text)` maps `variant.importPrice` (server locale-default) and labels with `product.importCurrency`. One and only one call site: the `<p>{getProductPrice(product, locale, text)}</p>` inside `relatedProducts.map(...)`. `getProductPrice` is used nowhere else (grep confirmed), so it is dead after the edit and must be removed.
- **Data path carries raw IDR:** `getPublishedNewsBySlug` (`src/app/api/news/newsService.js`) → `applyImportCurrencyToNews` → `applyImportCurrencyToProducts` → `convertVariantImportPrices` (`src/lib/currency.js`). `convertVariantImportPrices` attaches `importPriceIdr` (`?? importPrice ?? price`), `importDozenPriceIdr`, and `fromPriceIdr` to EVERY variant. So related products' variants ALREADY carry the `*Idr` snapshot fields. **No data-path fix is required.** (Decision: do not touch newsService.js or currency.js — the snapshot is already present and the server locale-default `importPrice` must remain for SEO.)
- **Client conversion pattern to mirror:** `src/components/card/page.js` is `'use client'`, calls `useCurrency()` from `@/components/currencyProvider/CurrencyProvider`, computes min/max from `variant.importPriceIdr ?? variant.price`, and renders `formatImport(min)` or `` `${formatImport(min)}-${formatImport(max)}` `` (single value when `min === max`). `formatImport` does raw-IDR × `rates[selectedCurrency]`, and falls back to an IDR label when no live rate exists. `useCurrency()` returns safe IDR defaults when no provider is mounted, and first paint uses the locale default (hydration-safe reconcile post-mount).
- **i18n:** `text.priceUnavailable` exists for both locales in `src/lib/i18n.js` ("Harga belum tersedia" / "Price is not available yet"). Reached via `getTranslations(locale).news`.
- **SEO (must stay locale-default, untouched):** In `NewsDetailPage.jsx`, `getNewsJsonLd` / `generateNewsDetailMetadata` do NOT render product prices at all (NewsArticle schema only) — nothing to change there. In `src/app/product/[productId]/ProductDetailPage.jsx`, `getProductOffers` / `buildOffersValue` / twitter / `product:price:*` read `variant.importPrice` + `product.importCurrency` — these are SEO-only and MUST remain server locale-default. No change to ProductDetailPage.
- **Grep sweep result (`importCurrency`, `.importPrice`, `formatCurrency(`):** The ONLY visible price rendered server-side from pre-converted fields is the `NewsDetailPage.jsx` related-products aside. Known-correct visible client renderers (`card/page.js`, `SearchProductClient.jsx`) already convert live. All other `importPrice`/`importCurrency` reads are either the currency lib internals, SEO blocks in `ProductDetailPage.jsx`, or data-pipeline code. **No other visible server-pre-converted price exists to convert.**
- **Message 1 ("beautiful pop up unable to fetch the rate"):** Already implemented — `src/components/currencyNotice/CurrencyNotice.jsx` is a hydration-safe toast wired to `ratesUnavailable`. Out of scope for this task; do not modify.
- **Build gate:** `npm run build` from repo root. PASS = reaches "Compiled successfully". A Prisma `PrismaClientInitializationError` at the "Collecting page data"/prerender phase is PRE-EXISTING (no live DB) and is NOT a failure. `npm run lint` is non-functional on Next 16; ignore it but keep edited files clean.

## Design decisions

- **New client component, props = `product` + `priceUnavailable` string.** Passing the whole `product` lets the component read `product.variants` the same way `Card` does and keeps the server JSX minimal. Passing the single `text.priceUnavailable` string (rather than the whole `text`/locale) is the smallest hydration-safe surface and matches current empty-state behavior. (Rationale: minimal prop surface, mirrors `Card`, no need to re-import i18n client-side.)
- **Compute from `variant.importPriceIdr ?? variant.price`** (exactly `Card`'s expression) so the single raw-IDR × rate multiply happens in `formatImport`. Do NOT read `importPrice` (already converted). (Rationale: `importPrice` is reserved for SEO; raw IDR is the client source of truth.)
- **Remove `getProductPrice`** rather than keep it — grep shows it has no SEO use; its only consumer is the replaced visible `<p>`. (Rationale: no dead code; SEO uses its own JSON-LD paths which never called it.)
- **Reuse `news/[slug]/page.css`** — the price lives in the existing `.news-product-card p` styling. No new CSS file needed. (Rationale: the `<p>` is simply replaced by the component's output within the same `<div>`; existing selector still applies if the component renders a `<p>`.)

---

# Implementation Plan

- [ ] 1. Create the `NewsRelatedPrice` client component.
      Create `'use client'` component that imports `useCurrency` from `@/components/currencyProvider/CurrencyProvider`. Props: `{ product, priceUnavailable }`. Compute `prices = product.variants.map((v) => v.importPriceIdr ?? v.price)`; if `product.variants` is empty / `prices.length === 0`, render `priceUnavailable`. Otherwise `min = Math.min(...prices)`, `max = Math.max(...prices)`, and render `min === max ? formatImport(min) : \`${formatImport(min)} - ${formatImport(max)}\``. Render the value inside a `<p>` so the existing `.news-product-card p` style applies (keep the " - " separator with spaces to match the old server output). No `window`/`localStorage`/module-top-level browser access — `useCurrency()` already handles hydration-safe locale-default-then-reconcile.
      Files: `src/components/newsRelatedPrice/NewsRelatedPrice.jsx` (no new page.css — reuse `news/[slug]/page.css`).
      Verify: `npm run build` from repo root reaches "Compiled successfully" (pre-existing Prisma prerender error is acceptable). The new component must appear in the build with no syntax/import errors.

- [ ] 2. Wire the component into `NewsDetailPage.jsx` and remove the dead server function.
      In `src/app/news/[slug]/NewsDetailPage.jsx`: add `import NewsRelatedPrice from "@/components/newsRelatedPrice/NewsRelatedPrice";`. In the `relatedProducts.map(...)` block, replace `<p>{getProductPrice(product, locale, text)}</p>` with `<NewsRelatedPrice product={product} priceUnavailable={text.priceUnavailable} />`. Delete the now-unused `getProductPrice` function definition. If `formatCurrency` becomes unused after the deletion, remove it from the `@/lib/i18n` import list (verify no other usage in the file first — the JSON-LD/metadata helpers do not use it). Leave the surrounding `<Link>` / `<img>` / `<h3>` / `<span>{text.seeProduct}</span>` server markup unchanged.
      Files: `src/app/news/[slug]/NewsDetailPage.jsx`.
      Verify: `npm run build` reaches "Compiled successfully". Confirm the file has no remaining reference to `getProductPrice` and no unused-import for `formatCurrency`.

- [ ] 3. Confirm SEO blocks remain untouched and verify end to end.
      Visually re-read `NewsDetailPage.jsx` (`getNewsJsonLd`, `generateNewsDetailMetadata`) and `src/app/product/[productId]/ProductDetailPage.jsx` (`getProductOffers`, `buildOffersValue`, twitter, `product:price:*`) to confirm they still read server locale-default `importPrice`/`importCurrency` with NO client/window access — these must be byte-for-byte unchanged from before this task except where step 2 touched NewsDetailPage. No code change expected in this step unless a regression is found.
      Files: none expected (verification only).
      Verify: `npm run build` reaches "Compiled successfully". Manually confirm (reading the diff) that no JSON-LD / metadata / twitter / `product:price` line changed, and that the only functional change is the visible related-product price now rendering through `NewsRelatedPrice` (client `formatImport`).

## Manual acceptance (post-build, for the reviewer / user)

- On `/en/news/<slug>` with GBP selected in the navbar, related-product prices in the aside render in GBP (converge to IDR label only when no live rate is available), matching the product cards. First paint shows the locale default (USD on `/en`) with no hydration warning, then reconciles to GBP after mount.
- Page source (SSR HTML) JSON-LD offers still show the locale-default currency (USD on `/en`, IDR on `/id`) — unaffected by the selector.
