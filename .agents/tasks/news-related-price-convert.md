# News "Related products" live currency conversion — verification trace

## What changed

- **New file** `src/components/newsRelatedPrice/NewsRelatedPrice.jsx` — a `'use client'`
  component. Props `{ product, priceUnavailable }`. Calls `useCurrency()` from
  `@/components/currencyProvider/CurrencyProvider`, computes min/max from the raw
  IDR snapshot (`variant.importPriceIdr ?? variant.price`, exactly Card's
  expression), and renders a `<p>` with `formatImport(min)` (single value when
  `min === max`) or `` `${formatImport(min)} - ${formatImport(max)}` ``. Empty
  variants/prices renders `priceUnavailable`, matching the old `getProductPrice`
  empty behavior. No new page.css — the output `<p>` reuses the existing
  `.news-product-card p` styling in `news/[slug]/page.css`.
- **Edited** `src/app/news/[slug]/NewsDetailPage.jsx`:
  - Added `import NewsRelatedPrice from "@/components/newsRelatedPrice/NewsRelatedPrice";`.
  - Replaced the visible `<p>{getProductPrice(product, locale, text)}</p>` in the
    `relatedProducts.map(...)` aside with
    `<NewsRelatedPrice product={product} priceUnavailable={text.priceUnavailable} />`.
  - Deleted the now-dead server `getProductPrice` function (grep confirmed one
    call site, no SEO use).
  - Removed `formatCurrency` from the `@/lib/i18n` import (it was only used by the
    deleted function; the JSON-LD `NewsArticle` schema and metadata helpers in this
    file never used it).
  - Left the surrounding `<Link>` / `<img>` / `<h3>` / `<span>{text.seeProduct}</span>`
    server markup unchanged.

No change to `src/lib/currency.js`, `src/app/api/news/newsService.js`, or
`src/app/product/[productId]/ProductDetailPage.jsx`.

## Build result

`npm run build` from the repo root:

```
▲ Next.js 16.3.8 (Turbopack)
✓ Compiled successfully in 1096ms
✓ Collecting page data using 15 workers in 3.4s
✓ Generating static pages using 15 workers (16/16) in 2.1s
Exit Code: 0
```

PASS — reached "Compiled successfully" with exit code 0. The news detail route
(`/news/[slug]`, `/en/news/[slug]`) and product detail route are `ƒ` (dynamic,
server-rendered on demand), so no prerender hit the DB; no Prisma error surfaced
this run. (Had one appeared at the "Collecting page data"/prerender phase it would
still be the accepted pre-existing PASS.)

## Trace (read-through)

### (a) Visible related price now flows raw IDR -> formatImport -> selected currency (GBP end to end)

1. `NewsDetailPage` server component renders the aside with
   `<NewsRelatedPrice product={product} priceUnavailable={text.priceUnavailable} />`.
2. `NewsRelatedPrice` is `'use client'`; it reads `formatImport` from
   `useCurrency()` (CurrencyProvider context).
3. It computes `prices = variants.map(v => v.importPriceIdr ?? v.price)` — the RAW
   IDR snapshot, NOT the server-converted `importPrice`.
4. `formatImport(amountIdr)` in `CurrencyProvider.buildContextValue` does the single
   multiply `convertFromIdr(amountIdr, rates[currency])` and formats via
   `formatCurrency(..., currency)`. With GBP selected and a live GBP rate loaded,
   `rates.GBP` (IDR->GBP) is finite/positive, so the amount is `rawIDR * rates.GBP`
   and labelled GBP. When no live GBP rate exists, `hasRate` is false and it falls
   back to `formatCurrency(amountIdr, "IDR")` (IDR label on the raw IDR number) —
   identical to Card's graceful fallback.
5. Selecting GBP in the navbar calls `setCurrency("GBP")`, which updates the
   provider's `currency` state; the memoized context value changes and
   `NewsRelatedPrice` re-renders with the GBP conversion — live update, no reload.

### (b) Raw-IDR fields are present on related product.variants (data path)

`NewsDetailPage` gets `news` from `getPublishedNewsBySlug(slug, locale)`
(`src/app/api/news/newsService.js`). That function:
`findNewsIdByLocalizedSlug` -> `prisma.news.findUnique({ include: newsInclude })`
(newsInclude pulls `products.product.variants`) -> `localizeNews` ->
`resolveImportConversion(locale)` -> `applyImportCurrencyToNews(localizedNews, rate, importCurrency)`.
`applyImportCurrencyToNews` maps `news.products[].product` through
`applyImportCurrencyToProducts(products, { rate, importCurrency })`
(`src/lib/currency.js`), which maps every variant through
`convertVariantImportPrices(variant, rate)`. That helper attaches
`importPriceIdr = variant.importPriceIdr ?? variant.importPrice ?? variant.price`
(plus `importDozenPriceIdr`, `fromPriceIdr`) to EVERY variant before converting
`importPrice`. So each related `product.variants[i].importPriceIdr` carries the raw
IDR snapshot the client needs. No data-path change was required.

### (c) JSON-LD / metadata on both detail pages still render locale-default currency, no browser state

- `NewsDetailPage.jsx`: `getNewsJsonLd` emits a `NewsArticle` schema (headline,
  description, image, dates, author/publisher, articleBody) — it never emitted a
  product price, so nothing to change. `generateNewsDetailMetadata` emits
  title/description/openGraph/twitter with no price field. Both untouched.
- `ProductDetailPage.jsx` (unchanged): `getProductOffers` / `buildOffersValue`,
  the twitter block, and `product:price:*` still read server locale-default
  `variant.importPrice` + `product.importCurrency`. No `window`/`localStorage`/
  client access. Byte-for-byte unchanged by this task.

The visible related-product price is the ONLY thing that became client-converted.

### (d) Hydration-safe first paint

`NewsRelatedPrice` reads currency only via `useCurrency()`. The provider's
`currency` state initializes to `getDefaultCurrencyForLocale(locale)` (the SSR
locale default: USD on /en, IDR on /id) and `rates` to `{ IDR: 1 }`; both the
localStorage override and the live rate fetch happen in post-mount `useEffect`s.
So server render and first client paint agree (locale default), then reconcile to
the selected currency after mount — the same mechanism Card uses. No `window`,
`localStorage`, or module-top-level browser access in the new component. No
hydration warning expected.

### (e) Grep-sweep results (importCurrency, .importPrice, formatCurrency( across src/app and src/components)

- `src/components/card/page.js` — known-correct VISIBLE client renderer (converts live). No change.
- `src/app/product/[productId]/SearchProductClient.jsx` — known-correct VISIBLE client renderer (uses `formatImport`, raw `importPriceIdr ?? price`). No change.
- `src/app/product/[productId]/ProductDetailPage.jsx` — SEO-only server reads (`getProductOffers`, `buildOffersValue`, twitter, `product:price:*`), must stay locale-default. No change.
- `src/lib/currency.js`, `src/lib/i18n.js`, `src/components/currencyProvider/CurrencyProvider.jsx`, `src/app/api/news/newsService.js`, `src/app/api/products/productService.js` — currency lib internals / data pipeline. No change.
- `src/app/news/[slug]/NewsDetailPage.jsx` — the one visible server-pre-converted price. FIXED here.

No other visible price rendered server-side from pre-converted fields was found, so
nothing else needed conversion.
