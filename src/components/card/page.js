import React from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import DiscountBadge from "../discount/page";

function Card({ product }) {
  const prices = product.variants.map((variant) => variant.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const fromPrices = product.variants.map((variant) => variant.fromPrice);
  const minFromPrice = Math.min(...fromPrices);
  const maxFromPrice = Math.max(...fromPrices);

  const discountPercentage = Math.round(((minFromPrice - minPrice) / minFromPrice) * 100);

  const formatRupiah = (price) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
    return formatted.replace(/\s+/g, '');
  };

  return (
    <Link href={`/product/${product.productId}`} className="card-container">
      <div className="card-fill">
        <div className='card-slider'>
          <div className='card-image-container'>
            <Image src={`/asset/product/${product.variants[0].picture}`} alt={`product-${product.variants[0].size}`} className='card-image' width={512} height={512}/>
          </div>
        </div>
        <p className="card-title">
          {product.title}
        </p>
        <div className="card-price-box">
          <p className="card-from-price">
            {minFromPrice === maxFromPrice ? formatRupiah(minFromPrice) : `${formatRupiah(minFromPrice)}-${formatRupiah(maxFromPrice)}`}
          </p>
          <p className="card-price">
            {minPrice === maxPrice ? formatRupiah(minPrice) : `${formatRupiah(minPrice)}-${formatRupiah(maxPrice)}`}
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
