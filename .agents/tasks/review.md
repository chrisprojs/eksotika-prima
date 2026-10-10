# Navbar currency selector with live import-price conversion

A selectable conversion-currency dropdown now sits next to the Eksotika Prima logo. It overrides each locale's default currency (id→IDR, en→USD), persists through localStorage, and drives live client-side conversion of import prices across product cards and the product detail view with no reload. Local prices stay IDR, and the server-rendered SEO/JSON-LD path is untouched so crawlers still see the stable locale-default currency. The design keeps the existing server conversion intact and adds raw-IDR fields alongside it so no client renderer loses the original IDR number.

Watch for: nothing blocking. All six acceptance criteria hold (confirmed by reading the diff and the touched files). The one thing worth a sentence is that the dropdown lists conversion currencies only — IDR included — which is exactly the requested wider set, so switching to IDR on an English page shows import prices back in IDR; that is intended behavior, not a bug.

**Verdict**: APPROVED

## High-level view

The dropdown is a native `<select>` rendered as a direct child of `.navbar-box`, placed between the logo `<Link>` and the `.navbar-menu` list, so it is not swallowed by the hamburger collapse and stays visible on mobile. Its options are the `SUPPORTED_CURRENCIES` list exported from `currency.js`: IDR, USD, EUR, GBP, SGD, MYR, AUD, JPY, CNY — the requested wider set, in that order.

State lives in a new client `CurrencyProvider` mounted in the root layout around Navbar/children/Footer. First paint uses the locale default derived from the pathname (same i18n helpers the navbar uses), so SSR and the first client render agree and there is no hydration mismatch. After mount, a window-guarded effect reads `ep.currency` from localStorage and overrides the default; a second effect loads rates from cached `ep.rates`/`ep.ratesAt` or fetches `/api/currency`. `setCurrency` persists the choice.

The conversion data shape is the key decision: the server still converts import prices to the locale default and attaches `importCurrency` (unchanged), and `convertVariantImportPrices` now also carries raw-IDR fields `importPriceIdr`/`importDozenPriceIdr`/`fromPriceIdr`. Client renderers ignore the pre-converted values and convert the raw-IDR fields live through the context, while server SEO renderers keep reading the pre-converted values.

Card and SearchProductClient both read the raw-IDR fields and format them via `formatImport`, so price range, strike-through from-price, discount %, and (for the detail view) the WhatsApp message price all follow the active currency on the import branch. The local branch and its WhatsApp message always format with `formatCurrency(amount, "IDR")`. Discount % is computed on IDR totals, so it stays stable across currencies.

The two server SEO files were not touched by this branch and still read `importCurrency` + pre-converted prices with no client/window/localStorage access, so JSON-LD and metadata prices remain on the locale default regardless of the browser selection.

<details>
<summary>Issues (0)</summary>

No blocking or actionable findings. All six acceptance criteria hold.

</details>

<details>
<summary>Details</summary>

## Selector placement and styling (criteria 1 and 2)

In `src/components/navbar/page.js` the `<select className="navbar-currency">` is rendered immediately after the `navbar-logo` `<Link>` and before the `.navbar-menu` `<ul>`, as a direct child of `.navbar-box` (confirmed by reading the JSX, lines ~34-58). It is bound to the context with `value={currency}` / `onChange={(e) => setCurrency(e.target.value)}` and labeled with `aria-label={text.currencyLabel}`, where `currencyLabel` is added to both the `id` ("Pilih mata uang") and `en` ("Choose currency") nav dictionaries in `src/lib/i18n.js`. Because it is outside `.navbar-menu`, the hamburger's `opacity:0` collapse does not hide it, so it stays visible on mobile (confirmed).

`src/components/navbar/page.css` adds a `.navbar-currency` rule for desktop (compact padding, translucent white border/background, white text to match the green bar, `:focus-visible` outline, dark option text) and a second `.navbar-currency` block inside the existing `@media (max-width: 768px)` with tighter padding and font-size (confirmed, lines 50-73 and inside the 768px block). The option list is the exact wider set `["IDR","USD","EUR","GBP","SGD","MYR","AUD","JPY","CNY"]` from `SUPPORTED_CURRENCIES` in `src/lib/currency.js` (confirmed).

## Override and persistence (criterion 3)

`CurrencyProvider` initializes `currency` state to `getDefaultCurrencyForLocale(getLocaleFromPathname(pathname || "/"))`, giving id→IDR and en→USD on first paint. A mount effect reads `ep.currency` and, if present and in `SUPPORTED_CURRENCIES`, overrides the default — so a stored choice wins over the locale default (confirmed, `CurrencyProvider.jsx` lines 49-59). `setCurrency` validates against the supported list and writes `ep.currency`. Rates are cached under `ep.rates` with timestamp `ep.ratesAt` and reused for an hour before re-fetching `/api/currency`. All three required keys are present and correctly named.

## Live conversion across renderers (criterion 4)

`src/components/card/page.js` is now a client component (`"use client"`) and computes `minPrice`/`maxPrice` from `variant.importPriceIdr ?? variant.price` and from-prices from `variant.fromPriceIdr ?? variant.fromPrice`, formatting every displayed value with `formatImport(...)` from the context. Discount % is computed on the IDR numbers before conversion, so it does not drift across currencies (confirmed).

`src/app/product/[productId]/SearchProductClient.jsx` reads the raw-IDR fields on the import branch (`importDozenPriceIdr`, `importPriceIdr ?? price`), keeps `selectedPrice` as a raw IDR amount, and routes display through a `formatActivePrice` helper that calls `formatImport` for import and `formatCurrency(amount, "IDR")` for local. The strike-through `fromPriceTotal`, the inline `searchProduct-price`, the discount %, and the WhatsApp `selectedPriceText` (which flows into `buyMessage` → `buyWhatsAppUrl`) all go through `formatActivePrice`, so the import branch reflects the active currency live and the WhatsApp link's price matches (confirmed, lines ~163-205). `activeFromPrice` is `fromPriceIdr ?? fromPrice` for import and `fromPriceLocal ?? fromPrice` for local.

The raw-IDR fields themselves are added in `convertVariantImportPrices` (`currency.js`) by reading the original variant before the overwrite: `importPriceIdr: variant.importPrice ?? variant.price`, `importDozenPriceIdr: variant.importDozenPrice`, `fromPriceIdr: variant.fromPrice`. The spread is over the original `variant`, so these capture pre-conversion numbers; the subsequent `importPrice`/`importDozenPrice`/`fromPrice` overwrites and `fromPriceLocal` preservation are left exactly as before (confirmed).

## Local price stays IDR (criterion 5)

On both renderers the local branch never touches the currency context for formatting: Card's price text is import-only by design (product cards show import prices), and SearchProductClient's `formatActivePrice` falls to `formatCurrency(amount, "IDR")` whenever `priceType !== "import"`, including the WhatsApp message. Local amounts read `variant.price`/`variant.dozenPrice`/`fromPriceLocal`, all IDR (confirmed).

## Server SEO not regressed (criterion 6)

`git diff v-6.0 --stat` shows neither `ProductDetailPage.jsx` nor `NewsDetailPage.jsx` in the changeset — they are byte-for-byte unchanged on this branch. Reading them confirms they still derive `offerCurrency`/`priceCurrency`/`importCurrency` from `product.importCurrency` and read the pre-converted `importPrice`/`importDozenPrice` for JSON-LD offers, metadata `product:price:*`, and the news related-product price (confirmed via grep over both files). Neither file contains `"use client"`, `useCurrency`, `window`, or `localStorage`. Server output therefore remains on the locale default independent of the browser selection.

## No server-side window/localStorage; signatures intact

A repo-wide scan for `window`/`localStorage` over `src/**/*.{js,jsx}` shows only the client `CurrencyProvider` (all accesses window-guarded and inside effects) and the pre-existing `footer/page.js` scroll handler (unchanged, in an effect). No module-top or server-render access was introduced (confirmed).

`getIdrToUsdRate()` keeps its no-arg async contract and now derives USD from `getIdrRateMap()`, falling back to `FALLBACK_RATES.USD`. `getImportConversionRate(locale)` and `applyImportCurrency`/`applyImportCurrencyToProducts` keep their signatures, and the callers in `productService.js` and `newsService.js` still invoke them unchanged, including the `{ rate, importCurrency }` conversion-object form (confirmed by reading the call sites).

## Build evidence

The coder's commit message records running `npm run build` inside the worktree: "✓ Compiled successfully in 3.4s", page data collected, 17/17 static pages generated, exit code 0, and `/api/currency` present in the route table with 1h revalidate. The pre-existing Prisma `Collecting page data` initialization error is not reported as a failure here, consistent with it being an environmental, pre-existing condition rather than a compile regression. Per the review instructions this build was not re-run; the recorded evidence is sufficient and specific.

<details>
<summary>File map</summary>

- `src/lib/currency.js` — SUPPORTED_CURRENCIES, getDefaultCurrencyForLocale, multi-currency Frankfurter fetch + rate map, convertFromIdr, getCurrencyFractionDigits, raw-IDR fields.
- `src/lib/i18n.js` — JPY whole-unit in formatCurrency; nav.currencyLabel for id/en.
- `src/app/api/currency/route.js` — new GET returning base/rates/supported with revalidate 3600.
- `src/components/currencyProvider/CurrencyProvider.jsx` — new client context/provider/useCurrency.
- `src/app/layout.js` — wraps Navbar/children/Footer in CurrencyProvider.
- `src/components/navbar/page.js` — currency `<select>` next to the logo, bound to context.
- `src/components/navbar/page.css` — `.navbar-currency` desktop + ≤768px styling.
- `src/components/card/page.js` — client component; renders from raw-IDR fields via formatImport.
- `src/app/product/[productId]/SearchProductClient.jsx` — import branch converts raw-IDR via formatImport; local stays IDR; WhatsApp price follows active currency.
- `ProductDetailPage.jsx`, `NewsDetailPage.jsx` — unchanged (verified).

Full diff: `git -C "<worktree>" diff v-6.0`.

</details>

</details>
