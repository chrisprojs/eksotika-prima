"use client";
import React, { useEffect, useState } from "react";
import { getProductById } from "@/fetch/getProductById";
import Image from "next/image";
import "./page.css";
import Loading from "@/components/loading/page";
import DiscountBadge from "@/components/discount/page";

export default function SearchProduct({ params }) {
  const { productId } = params;
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      const foundProduct = await getProductById(productId);
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedVariant((prev) => prev || foundProduct.variants[0]);
        setSelectedPrice((prev) => prev || foundProduct.variants[0].price)
      }
    };

    fetchProduct();
  }, [productId, selectedVariant]);

  const formatRupiah = (price) => {
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
    return formatted.replace(/\s+/g, "");
  };

  const changePrice = (packages = null, variants = null) => {
    setSelectedVariant(variants)
    setSelectedPackage(packages)

    if(packages == 1){
      setSelectedPrice(variants.price)
    }
    else if(packages == 12){
      setSelectedPrice(variants.dozenPrice)
    }
  }

  if (!product || !selectedVariant) {
    return <Loading />;
  } else {
    const discountPercentage = Math.round(
      (((selectedPackage * selectedVariant.fromPrice) - selectedPrice) /
        (selectedPackage * selectedVariant.fromPrice)) *
        100
    );
    return (
      <div className="page-container searchProduct-container">
        <div className="searchProduct-displayer">
          <div className="searchProduct-image-container">
            <Image
              src={`/asset/product/${selectedVariant.picture}`}
              alt={`product-${selectedVariant.size}`}
              className="searchProduct-image"
              width={512}
              height={512}
            />
          </div>
        </div>
        <div className="searchProduct-box">
          <h1 className="searchProduct-title">
            {product.title} - {selectedVariant.size}
          </h1>
          <p className="searchProduct-price">
            {formatRupiah(selectedPrice)}{" "}
            <DiscountBadge
              discountPercentage={discountPercentage}
              isLarge={true}
            />{" "}
            <span className="searchProduct-fromPrice">
              {formatRupiah(selectedPackage * selectedVariant.fromPrice)}
            </span>
          </p>
          <p className="searchProduct-text">
            <strong>Ukuran:</strong>
          </p>
          <div className="searchProduct-badge-box">
            <span
              className={`searchProduct-badge ${
                selectedPackage === 1 ? "selected" : ""
              }`}
              onClick={() => changePrice(1,selectedVariant)}
            >
              satuan (1pcs)
            </span>
            {selectedVariant.dozenPrice && (
              <span
                className={`searchProduct-badge ${
                  selectedPackage === 12 ? "selected" : ""
                }`}
                onClick={() => changePrice(12,selectedVariant)}
              >
                lusin (12 pcs)
              </span>
            )}
          </div>
          <p className="searchProduct-text">
            <strong>Paket:</strong>
          </p>
          <div className="searchProduct-badge-box">
            {product.variants.map((variant) => (
              <span
                key={variant.size}
                className={`searchProduct-badge ${
                  selectedVariant.size === variant.size ? "selected" : ""
                }`}
                onClick={() => changePrice(selectedPackage,variant)}
              >
                <Image
                  src={`/asset/product/${variant.picture}`}
                  alt={`product-${variant.size}`}
                  className="searchProduct-badge-image"
                  width={512}
                  height={512}
                />
                {variant.size}
              </span>
            ))}
          </div>
          <div className="searchProduct-mergeline">
            <p className="searchProduct-text">
              <strong>Merk:</strong> {product.merk}
            </p>
            <p className="searchProduct-text">
              <strong>Produsen:</strong> {product.produsen}
            </p>
          </div>
          <p className="searchProduct-text">
            <strong>Detail:</strong>
            <br />
            <span className="searchProduct-detail">{product.detail}</span>
          </p>
        </div>
      </div>
    );
  }
}
