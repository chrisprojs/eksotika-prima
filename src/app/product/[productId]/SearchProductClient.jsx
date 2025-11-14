"use client";
import React, { useEffect, useState } from "react";
import { getProductById } from "@/fetch/getProductById";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./page.css";
import Loading from "@/components/loading/page";
import DiscountBadge from "@/components/discount/page";

export default function SearchProduct({ params }) {
  const { productId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      const foundProduct = await getProductById(productId);
      if (foundProduct && !Array.isArray(foundProduct) && foundProduct.variants) {
        setProduct(foundProduct);
      }
    };
    fetchProduct();
  }, [productId]);

  // Sync URL params with state
  useEffect(() => {
    if (!product || !product.variants || product.variants.length === 0) return;

    const variantSizeParam = searchParams.get("variant");
    const variantSize = variantSizeParam
      ? decodeURIComponent(variantSizeParam.replace(/\+/g, " "))
      : null;
    const quantityParam = searchParams.get("quantity");

    let targetVariant = product.variants[0];
    if (variantSize) {
      const variantFromUrl = product.variants.find((v) => v.size === variantSize);
      if (variantFromUrl) {
        targetVariant = variantFromUrl;
      }
    }

    let targetQuantity = quantityParam ? parseInt(quantityParam, 10) : 1;
    if (targetQuantity !== 1 && targetQuantity !== 12) {
      targetQuantity = 1;
    }

    setSelectedVariant(targetVariant);
    setSelectedQuantity(targetQuantity);

    if (targetQuantity === 12 && targetVariant.dozenPrice) {
      setSelectedPrice(targetVariant.dozenPrice);
    } else if (targetVariant.price !== undefined) {
      setSelectedPrice(targetVariant.price);
    }

    if (
      !variantSize ||
      !quantityParam ||
      variantSize !== targetVariant.size ||
      parseInt(quantityParam, 10) !== targetQuantity
    ) {
      const params = new URLSearchParams();
      params.set("variant", targetVariant.size);
      params.set("quantity", targetQuantity.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [product, searchParams]);

  // Update price whenever variant or quantity changes
  useEffect(() => {
    if (!selectedVariant) return;
    if (
      selectedQuantity === 12 &&
      selectedVariant.dozenPrice !== undefined &&
      selectedVariant.dozenPrice !== null
    ) {
      setSelectedPrice(selectedVariant.dozenPrice);
    } else if (
      selectedVariant.price !== undefined &&
      selectedVariant.price !== null
    ) {
      setSelectedPrice(selectedVariant.price);
    }
  }, [selectedVariant, selectedQuantity]);

  const formatRupiah = (price) => {
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
    return formatted.replace(/\s+/g, "");
  };

  // Generate SEO title text
  const getTitleText = (product, variant, quantityOption) => {
    if (!product || !variant) return "";
    const quantityText =
      quantityOption !== 1
        ? " - " + (quantityOption === 12 ? "lusin (12pcs)" : "")
        : "";
    return `${product.title} - ${variant.size}${quantityText}`;
  };

  // Update URL params when selection changes
  const updateUrlParams = (variant, quantityOption) => {
    const params = new URLSearchParams();
    params.set("variant", variant.size);
    params.set("quantity", quantityOption.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle variant or quantity change
  const changePrice = (quantitys = null, variants = null) => {
    setSelectedVariant(variants);
    setSelectedQuantity(quantitys);

    if (quantitys === 12 && variants.dozenPrice) {
      setSelectedPrice(variants.dozenPrice);
    } else {
      setSelectedPrice(variants.price);
    }

    updateUrlParams(variants, quantitys);
  };

  if (!product || !selectedVariant) {
    return <Loading />;
  }

  // Calculate discount percentage
  const fromPriceTotal = selectedQuantity * selectedVariant.fromPrice;
  const discountPercentage =
    fromPriceTotal > 0
      ? Math.round(((fromPriceTotal - selectedPrice) / fromPriceTotal) * 100)
      : 0;

  const tagTitle = getTitleText(product, selectedVariant, selectedQuantity);

  return (
    <>
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
            {tagTitle}
          </h1>

          <p className="searchProduct-price">
            {formatRupiah(selectedPrice)}{" "}
            <DiscountBadge
              discountPercentage={discountPercentage}
              isLarge={true}
            />{" "}
            <span className="searchProduct-fromPrice">
              {formatRupiah(selectedQuantity * selectedVariant.fromPrice)}
            </span>
          </p>

          <p className="searchProduct-text">
            <strong>Ukuran:</strong>
          </p>

          <div className="searchProduct-badge-box">
            <span
              className={`searchProduct-badge ${
                selectedQuantity === 1 ? "selected" : ""
              }`}
              onClick={() => changePrice(1, selectedVariant)}
            >
              satuan (1pcs)
            </span>
            {selectedVariant.dozenPrice && (
              <span
                className={`searchProduct-badge ${
                  selectedQuantity === 12 ? "selected" : ""
                }`}
                onClick={() => changePrice(12, selectedVariant)}
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
                onClick={() => changePrice(selectedQuantity, variant)}
              >
                <Image
                  src={`/api/images/product/${variant.picture}`}
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
    </>
  );
}
