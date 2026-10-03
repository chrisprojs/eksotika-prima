# Price selection feature for Card and ProductDetailPage

Adds import/local price selection toggle to product detail page while keeping Card component defaults to import price. Card uses importPrice with null fallback; ProductDetailPage has toggle defaulting to Import with React state persistence. Watch for: breaking change to currency formatting function causes runtime errors.

**Verdict**: CHANGES_REQUESTED

## High-level view

Price selection logic maps import vs local prices correctly with null fallbacks. Import is default in Card (always) and ProductDetailPage (initial toggle state). Dozen prices respect selected type: importDozenPrice for import, dozenPrice for local.

A breaking change slipped into currency formatting: formatIdr no longer accepts locale parameter but call sites still pass it, causing runtime errors. Must revert before shipping.

Translation dictionaries gained price type labels with UI fallbacks for missing keys.

<details>
<summary>Issues (1)</summary>

1. **Currency formatting regression** — `formatIdr` function lost locale parameter and locale-sensitive formatting while still being called with locale, causing runtime errors and showing "IDR" prefix instead of "Rp" for Indonesian users. Revert the formatIdr change.

</details>

## Behavioral details

<details>
<summary>Details</summary>

### Price type toggle and state management

SearchProductClient adds `priceType` state defaulting to "import". Badge-style toggles switch between Import/Local prices. State persists within component view but not in URL or across navigation.

`getVariantPrice` extended with priceType parameter, returning importDozenPrice for dozen+import, dozenPrice for dozen+local, falling back to base import/price logic. useEffect updates all price calculations when priceType changes.

### Unrelated breaking change to currency formatting

`formatIdr` function lost locale parameter and locale-sensitive formatting. Now always returns "IDR" prefix with English numbers while call sites still pass locale parameter. Indonesian users see "IDR 50.000" instead of "Rp50.000" — regression in localization unrelated to price selection.

</details>

## File map

- `src/components/card/page.js` — Card uses importPrice with fallback to price
- `src/app/product/[productId]/SearchProductClient.jsx` — Price type toggle with state management
- `src/app/product/[productId]/ProductDetailPage.jsx` — Structured data uses import prices
- `src/lib/i18n.js` — Added price type labels, broke formatIdr function

See full diff for line-by-line changes.