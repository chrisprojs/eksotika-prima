"use client";

import { useCurrency } from "@/components/currencyProvider/CurrencyProvider";

// Renders the related-product price range on the news detail page, converting
// live to the navbar-selected currency. Mirrors the product Card pattern:
// compute from the raw IDR snapshot (variant.importPriceIdr ?? variant.price)
// and format through useCurrency().formatImport so the single raw-IDR x rate
// multiply happens client-side. First paint uses the locale default (the
// provider reconciles the selected currency post-mount), so this stays
// hydration-safe.
function NewsRelatedPrice({ product, priceUnavailable }) {
  const { formatImport } = useCurrency();

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const prices = variants.map(
    (variant) => variant.importPriceIdr ?? variant.price
  );

  if (prices.length === 0) {
    return <p>{priceUnavailable}</p>;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceText =
    minPrice === maxPrice
      ? formatImport(minPrice)
      : `${formatImport(minPrice)} - ${formatImport(maxPrice)}`;

  return <p>{priceText}</p>;
}

export default NewsRelatedPrice;
