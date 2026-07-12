"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./page.css";
import Loading from "@/components/loading/page";
import DiscountBadge from "@/components/discount/page";
import { formatIdr, getTranslations } from "@/lib/i18n";

function getFirstVariant(product) {
  return Array.isArray(product?.variants) ? product.variants[0] || null : null;
}

function getValidQuantity(quantity, variant) {
  return quantity === 12 && variant?.dozenPrice ? 12 : 1;
}

function getVariantPrice(variant, quantity) {
  if (!variant) return 0;

  if (quantity === 12 && variant.dozenPrice !== undefined && variant.dozenPrice !== null) {
    return variant.dozenPrice;
  }

  return variant.price ?? 0;
}

export default function SearchProduct({ product = null, locale = "id" }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const text = getTranslations(locale).productDetail;
  const firstVariant = getFirstVariant(product);
  const [currentProduct] = useState(product);
  const [selectedVariant, setSelectedVariant] = useState(firstVariant);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(() =>
    getVariantPrice(firstVariant, 1)
  );

  useEffect(() => {
    if (!currentProduct || !currentProduct.variants || currentProduct.variants.length === 0) return;

    const variantSize = searchParams.get("variant");
    const quantityParam = searchParams.get("quantity");

    if (!variantSize && !quantityParam) return;

    let targetVariant = currentProduct.variants[0];
    if (variantSize) {
      const variantFromUrl = currentProduct.variants.find((v) => v.size === variantSize);
      if (variantFromUrl) {
        targetVariant = variantFromUrl;
      }
    }

    const parsedQuantity = quantityParam ? parseInt(quantityParam, 10) : 1;
    const targetQuantity = getValidQuantity(parsedQuantity, targetVariant);

    setSelectedVariant(targetVariant);
    setSelectedQuantity(targetQuantity);
    setSelectedPrice(getVariantPrice(targetVariant, targetQuantity));
    router.replace(pathname, { scroll: false });
  }, [currentProduct, searchParams, pathname, router]);

  useEffect(() => {
    if (!selectedVariant) return;
    setSelectedPrice(getVariantPrice(selectedVariant, selectedQuantity));
  }, [selectedVariant, selectedQuantity]);

  const getTitleText = (productItem, variant, quantityOption) => {
    if (!productItem || !variant) return "";
    const quantityText =
      quantityOption !== 1
        ? " - " + (quantityOption === 12 ? text.dozenSuffix : "")
        : "";
    return `${productItem.title} - ${variant.size}${quantityText}`;
  };

  const changePrice = (quantityOption = 1, variant = null) => {
    const targetVariant = variant || selectedVariant;
    const targetQuantity = getValidQuantity(quantityOption, targetVariant);

    setSelectedVariant(targetVariant);
    setSelectedQuantity(targetQuantity);
    setSelectedPrice(getVariantPrice(targetVariant, targetQuantity));
  };

  if (!currentProduct || !selectedVariant) {
    return <Loading />;
  }

  const fromPriceTotal = selectedQuantity * (selectedVariant.fromPrice || 0);
  const discountPercentage =
    fromPriceTotal > 0
      ? Math.round(((fromPriceTotal - selectedPrice) / fromPriceTotal) * 100)
      : 0;

  const tagTitle = getTitleText(currentProduct, selectedVariant, selectedQuantity);

  return (
    <>
      <div className="page-container searchProduct-container">
        <div className="searchProduct-displayer">
          <div className="searchProduct-image-container">
            <Image
              src={`/asset/product/${selectedVariant.picture}`}
              alt={`${currentProduct.title} ${selectedVariant.size}`}
              className="searchProduct-image"
              width={512}
              height={512}
              priority
            />
          </div>
        </div>

        <div className="searchProduct-box">
          <h1 className="searchProduct-title">
            {tagTitle}
          </h1>

          <p className="searchProduct-price">
            {formatIdr(selectedPrice, locale)}{" "}
            <DiscountBadge
              discountPercentage={discountPercentage}
              isLarge={true}
            />{" "}
            <span className="searchProduct-fromPrice">
              {formatIdr(fromPriceTotal, locale)}
            </span>
          </p>

          <p className="searchProduct-text">
            <strong>{text.quantityLabel}</strong>
          </p>

          <div className="searchProduct-badge-box">
            <span
              className={`searchProduct-badge ${
                selectedQuantity === 1 ? "selected" : ""
              }`}
              onClick={() => changePrice(1, selectedVariant)}
            >
              {text.single}
            </span>
            {selectedVariant.dozenPrice && (
              <span
                className={`searchProduct-badge ${
                  selectedQuantity === 12 ? "selected" : ""
                }`}
                onClick={() => changePrice(12, selectedVariant)}
              >
                {text.dozen}
              </span>
            )}
          </div>

          <p className="searchProduct-text">
            <strong>{text.variantLabel}</strong>
          </p>

          <div className="searchProduct-badge-box">
            {currentProduct.variants.map((variant) => (
              <span
                key={variant.size}
                className={`searchProduct-badge ${
                  selectedVariant.size === variant.size ? "selected" : ""
                }`}
                onClick={() => changePrice(selectedQuantity, variant)}
              >
                <Image
                  src={`/api/images/product/${variant.picture}`}
                  alt={`${currentProduct.title} ${variant.size}`}
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
              <strong>{text.brandLabel}</strong> {currentProduct.merk}
            </p>
            <p className="searchProduct-text">
              <strong>{text.producerLabel}</strong> {currentProduct.produsen}
            </p>
          </div>

          <p className="searchProduct-text">
            <strong>{text.detailLabel}</strong>
            <br />
            <span className="searchProduct-detail">{currentProduct.detail}</span>
          </p>
        </div>
      </div>
    </>
  );
}