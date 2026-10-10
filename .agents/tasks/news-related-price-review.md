# News "Related products" live currency conversion

The news-detail "Related products" aside used to render each product's price server-side from the pre-converted `variant.importPrice` labeled with `product.importCurrency`, so the navbar currency selector never touched it (GBP stayed USD on `/en`). This change (commit `9a2d7f0` on `v-6.0`) extracts a new `'use client'` `NewsRelatedPrice` component that reads the raw-IDR snapshot (`variant.importPriceIdr ?? variant.price`) and formats through `useCurrency().formatImport`, exactly mirroring the product `Card`. The visible price now follows the selector live and reconciles post-mount for a hydration-safe first paint, while all SEO (JSON-LD / metadata / twitter / `product:price:*`) on both detail pages stays untouched on the locale default. The dead `getProductPrice` server function and its now-unused `formatCurrency` import were removed.

Watch for: nothing blocking. The data-path dependency (related variants carrying `importPriceIdr`) is satisfied by the existing pipeline and verified below (confirmed).

**Verdict**: APPROVED

## High-level view

The fix is a one-for-one swap of a server-rendered `<p>{getProductPrice(...)}</p>` for a client component, so the visible price joins the same conversion path the product cards already use. The conversion math (`raw IDR × rates[selected]`, IDR-labeled fallback when no live rate) lives entirely in `CurrencyProvider.formatImport`, which the new component reuses rather than reimplements — min/max range behavior and the empty-price case match `Card`.

The raw-IDR snapshot the client depends on is attached upstream by `convertVariantImportPrices` for every variant in the news pipeline, so no data-path change was needed; the related products reaching the component already carry `importPriceIdr`.

SEO is cleanly segregated: the news page's JSON-LD is a `NewsArticle` schema that never emitted a price, and `ProductDetailPage.jsx`'s offer/metadata/twitter/`product:price` blocks still read server-converted `importPrice` + `importCurrency` with no browser state. The fix commit did not touch `ProductDetailPage.jsx`, `currency.js`, or `newsService.js`. The grep sweep found no other visible server-pre-converted price, and `/api/currency` remains absent.

<details>
<summary>Issues (0)</summary>

No blocking or non-blocking action items. All six acceptance criteria pass.

</details>

<details>
<summary>Details</summary>

### Visible price now flows raw IDR → formatImport → selected currency (criteria 1, 2)

`NewsDetailPage` renders `<NewsRelatedPrice product={product} priceUnavailable={text.priceUnavailable} />` inside the `relatedProducts.map(...)` aside, replacing the old server `<p>`. `NewsRelatedPrice` is `'use client'`, pulls `formatImport` from `useCurrency()`, and computes `prices = variants.map(v => v.importPriceIdr ?? v.price)` — the raw IDR snapshot, not the server-converted `importPrice` (confirmed). The range logic matches `Card`: `min === max ? formatImport(min) : \`${formatImport(min)} - ${formatImport(max)}\``, and `prices.length === 0` renders `priceUnavailable` (confirmed).

The one cosmetic difference from `Card` is the separator: `Card` uses `${min}-${max}` (no spaces) while `NewsRelatedPrice` uses `${min} - ${max}` (spaces). This is intentional and correct — the plan calls for preserving the old server output's spaced " - " separator for the news aside, so this matches prior behavior rather than Card's exact string (confirmed).

Label correctness is delegated to `CurrencyProvider.buildContextValue.formatImport`: when `rates[selected]` is a finite positive number it returns `formatCurrency(convertFromIdr(amountIdr, rates[currency]), currency)` — a single raw-IDR × rate multiply under the selected label; when no usable rate exists (`hasRate` false) it returns `formatCurrency(amountIdr, "IDR")`, i.e. the raw IDR number under an IDR label (confirmed). So selecting GBP with a live GBP rate shows `rawIDR × rates.GBP` labeled GBP; with no GBP rate it shows the IDR amount labeled IDR — the no-fallback behavior is preserved and no foreign label ever sits on an unconverted number.

### Raw-IDR snapshot reaches the related variants (criterion 3)

`getPublishedNewsBySlug(slug, locale)` resolves the news record (`newsInclude` pulls `products.product.variants`), localizes it, then calls `applyImportCurrencyToNews(localizedNews, rate, importCurrency)`. That maps each related product through `applyImportCurrencyToProducts`, which runs every variant through `convertVariantImportPrices(variant, rate)` (confirmed). That helper attaches `importPriceIdr = variant.importPriceIdr ?? variant.importPrice ?? variant.price` (plus `importDozenPriceIdr`, `fromPriceIdr`) to every variant before overwriting `importPrice` with the server-converted value. So the related `product.variants[i].importPriceIdr` carries the genuine raw IDR amount the client reads, and there is no double conversion — the client converts from the preserved IDR snapshot, never from the already-converted `importPrice` (confirmed). No data-path change was required and none was made.

### SEO stays server locale-default (criterion 4)

The fix commit (`git show 9a2d7f0 --stat`) touches only `NewsDetailPage.jsx`, the new `NewsRelatedPrice.jsx`, and the convert trace doc; `ProductDetailPage.jsx`, `currency.js`, and `newsService.js` are untouched (confirmed). In `NewsDetailPage.jsx`, `getNewsJsonLd` emits a `NewsArticle` schema (headline/description/image/dates/author/publisher/articleBody) that never rendered a price, and `generateNewsDetailMetadata` carries no price field, so there was nothing price-related to protect there. In `ProductDetailPage.jsx`, `getProductOffers` / `buildOffersValue` read `variant.importPrice` + `product.importCurrency` purely server-side, and the twitter / `product:price:*` blocks read `product.importCurrency` the same way — no `window`, `localStorage`, or `useCurrency` anywhere in those paths (confirmed). The dead `getProductPrice` was removed and `formatCurrency` was dropped from the `@/lib/i18n` import; a grep for both names in `src/app/news/**/*.jsx` returns no matches, so no dangling reference or unused import remains (confirmed).

### Hydration safety and no regressions (criterion 5)

`NewsRelatedPrice` reads currency only through `useCurrency()`; it has no `window`/`localStorage`/module-top-level browser access (confirmed). The provider initializes `currency` to `getDefaultCurrencyForLocale(locale)` (USD on `/en`, IDR on `/id`) and `rates` to `{ IDR: 1 }`, with the localStorage override and the live rate fetch both deferred to post-mount effects — so the server render and first client paint agree on the locale default, then reconcile to the selected currency. This is the same mechanism `Card` relies on. `useCurrency()` also returns safe IDR defaults when no provider is mounted, so the component cannot throw.

No server-only import is pulled into the client component — it imports only `useCurrency` from the client provider. `/api/currency` is absent (file search returns nothing), consistent with the direct-from-browser Frankfurter fetch. The grep sweep across `src/components/**` and `src/app/**/*.jsx` for `.importPrice` / `importCurrency` / `formatCurrency(` surfaces only: the two known-correct client renderers (`card/page.js`, `SearchProductClient.jsx`, both using `formatImport` on raw IDR), the SEO-only server reads in `ProductDetailPage.jsx`, and the provider internals — no other visible server-pre-converted price exists (confirmed). `Card`, `SearchProductClient`, the per-language localStorage override, and the `ratesUnavailable`-driven popup are all untouched by this commit.

### Build evidence (criterion 6)

The coder's trace (`news-related-price-convert.md`) records `npm run build` reaching `✓ Compiled successfully in 1096ms` with exit code 0, static generation completing 16/16, and the detail routes being dynamic (`ƒ`) so no Prisma prerender fired this run. The evidence is present, specific, and internally consistent (version banner, compile line, page-data/static-generation lines, exit code), and the task instruction is to trust it without re-running. No new compile/import/hydration/SSR error is reported. Per instruction, this is accepted as PASS; a pre-existing Prisma prerender error would also have been acceptable. (confirmed via recorded evidence)

</details>

<details>
<summary>File map</summary>

- `src/components/newsRelatedPrice/NewsRelatedPrice.jsx` — new `'use client'` component; converts the related-product price live via `useCurrency().formatImport` on the raw-IDR snapshot.
- `src/app/news/[slug]/NewsDetailPage.jsx` — swapped the server `<p>{getProductPrice(...)}</p>` for `<NewsRelatedPrice>`; deleted dead `getProductPrice` and its `formatCurrency` import.
- `.agents/tasks/news-related-price-convert.md` — coder's verification trace and build evidence.

Full diff: `git show 9a2d7f0`.

</details>
