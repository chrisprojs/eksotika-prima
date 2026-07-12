"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./page.css";
import Loading from "@/components/loading/page";
import DiscountBadge from "@/components/discount/page";
import { formatIdr, getTranslations } from "@/lib/i18n";
import { cleanProductHtml } from "@/lib/newsHtml";
import { ContactInformation } from "@/data/ContactInformation";

const WHOLESALE_QUANTITY = "wholesale";

function getFirstVariant(product) {
  return Array.isArray(product?.variants) ? product.variants[0] || null : null;
}

function getValidQuantity(quantity, variant) {
  if (quantity === WHOLESALE_QUANTITY) return WHOLESALE_QUANTITY;

  return quantity === 12 && variant?.dozenPrice ? 12 : 1;
}

function getVariantPrice(variant, quantity) {
  if (!variant) return 0;

  if (quantity === WHOLESALE_QUANTITY) return null;

  if (quantity === 12 && variant.dozenPrice !== undefined && variant.dozenPrice !== null) {
    return variant.dozenPrice;
  }

  return variant.price ?? 0;
}

function getWhatsAppNumber(phoneNumber = "") {
  return phoneNumber.replace(/\D/g, "");
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

    const parsedQuantity =
      quantityParam === WHOLESALE_QUANTITY
        ? WHOLESALE_QUANTITY
        : parseInt(quantityParam, 10);
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
    let quantityText = "";

    if (quantityOption === 12) {
      quantityText = ` - ${text.dozenSuffix}`;
    }

    if (quantityOption === WHOLESALE_QUANTITY) {
      quantityText = ` - ${text.wholesaleSuffix}`;
    }
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

  const isWholesale = selectedQuantity === WHOLESALE_QUANTITY;
  const fromPriceTotal = isWholesale
    ? 0
    : selectedQuantity * (selectedVariant.fromPrice || 0);
  const discountPercentage =
    !isWholesale && fromPriceTotal > 0
      ? Math.round(((fromPriceTotal - selectedPrice) / fromPriceTotal) * 100)
      : 0;

  const tagTitle = getTitleText(currentProduct, selectedVariant, selectedQuantity);
  const selectedQuantityText = isWholesale
    ? text.wholesaleSuffix
    : selectedQuantity === 12
      ? text.dozenSuffix
      : text.single;
  const selectedPriceText = isWholesale
    ? text.wholesalePriceText
    : formatIdr(selectedPrice, locale);
  const buyMessage =
    typeof text.buyWhatsAppMessage === "function"
      ? text.buyWhatsAppMessage(
          currentProduct.title,
          selectedVariant.size,
          selectedQuantityText,
          selectedPriceText
        )
      : `Halo, saya mau beli ${currentProduct.title} - ${selectedVariant.size} (${selectedQuantityText}). Harga: ${selectedPriceText}.`;
  const buyWhatsAppUrl = `https://wa.me/${getWhatsAppNumber(
    ContactInformation.whatsappNumber
  )}?text=${encodeURIComponent(buyMessage)}`;
  const detailHtml = cleanProductHtml(currentProduct.detail ?? "");

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

          {isWholesale ? (
            <div className="searchProduct-price-box">
              <p className="searchProduct-price searchProduct-price-negotiate">
                {text.wholesalePriceText}
              </p>
            </div>
          ) : (
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
          )}

          <a
            href={buyWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="searchProduct-whatsapp"
          >
            <Image
              src="/asset/whatsapp-logo.png"
              alt="WhatsApp"
              className="searchProduct-whatsapp-icon"
              width={100}
              height={100}
            />
            {text.buyWhatsAppButton}
          </a>

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
            <span
              className={`searchProduct-badge ${
                selectedQuantity === WHOLESALE_QUANTITY ? "selected" : ""
              }`}
              onClick={() => changePrice(WHOLESALE_QUANTITY, selectedVariant)}
            >
              {text.wholesale}
            </span>
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

          <div className="searchProduct-text">
            <strong>{text.detailLabel}</strong>
            <br />
            <div
              className="searchProduct-detail"
              dangerouslySetInnerHTML={{ __html: detailHtml }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
