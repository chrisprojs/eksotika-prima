"use client";
import React from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import DiscountBadge from "../discount/page";
import { getLocalizedPath } from "@/lib/i18n";
import { getProductImageSrc } from "@/lib/productImageSrc";
import { useCurrency } from "@/components/currencyProvider/CurrencyProvider";

function Card({ product, locale = "id" }) {
  const { formatImport } = useCurrency();
  // Compute from the raw IDR fields so the selected currency converts live.
  const prices = product.variants.map(
    (variant) => variant.importPriceIdr ?? variant.price
  );
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const fromPrices = product.variants.map(
    (variant) => variant.fromPriceIdr ?? variant.fromPrice
  );
  const minFromPrice = Math.min(...fromPrices);
  const maxFromPrice = Math.max(...fromPrices);

  // Discount ratio is currency-independent, so compute it on the IDR numbers
  // to avoid rounding drift across converted currencies.
  const discountPercentage = Math.round(((minFromPrice - minPrice) / minFromPrice) * 100);

  const priceText =
    minPrice === maxPrice
      ? formatImport(minPrice)
      : `${formatImport(minPrice)}-${formatImport(maxPrice)}`;
  const fromPriceText =
    minFromPrice === maxFromPrice
      ? formatImport(minFromPrice)
      : `${formatImport(minFromPrice)}-${formatImport(maxFromPrice)}`;

  return (
    <Link href={getLocalizedPath(`/product/${product.productId}`, locale)} className="card-container">
      <div className="card-fill">
        <div className="card-slider">
          <div className="card-image-container">
            <Image src={getProductImageSrc(product.variants[0].picture)} alt={`product-${product.variants[0].size}`} className="card-image" width={512} height={512}/>
          </div>
        </div>
        <p className="card-title">
          {product.title}
        </p>
        <div className="card-price-box">
          <p className="card-from-price">{fromPriceText}</p>
          <p className="card-price">
            {priceText}
            <DiscountBadge discountPercentage={discountPercentage} />
          </p>
        </div>
        <div className="card-variants">
          {product.variants.map((variant) => (
            <span
              key={variant.size}
              className="card-variants-badge"
            >
              {variant.size}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default Card;

