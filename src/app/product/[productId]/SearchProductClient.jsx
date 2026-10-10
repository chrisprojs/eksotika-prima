"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./page.css";
import Loading from "@/components/loading/page";
import DiscountBadge from "@/components/discount/page";
import { formatCurrency, getTranslations } from "@/lib/i18n";
import { cleanProductHtml } from "@/lib/newsHtml";
import { ContactInformation } from "@/data/ContactInformation";
import { getProductImageSrc } from "@/lib/productImageSrc";
import { useCurrency } from "@/components/currencyProvider/CurrencyProvider";

const WHOLESALE_QUANTITY = "wholesale";

function getFirstVariant(product) {
  return Array.isArray(product?.variants) ? product.variants[0] || null : null;
}

function getValidQuantity(quantity, variant) {
  if (quantity === WHOLESALE_QUANTITY) return WHOLESALE_QUANTITY;

  // Any positive integer is a valid custom quantity; non-positive / NaN
  // values fall back to a single unit. (The `variant` argument is kept for
  // call-site compatibility.)
  const n = Math.floor(Number(quantity));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

// Pick the raw-IDR single and dozen unit prices that match the active price
// type. A null/undefined dozen field means the variant has no dozen price.
function getRawUnitPrices(variant, priceType = "import") {
  if (priceType === "import") {
    return {
      singleIdr: variant.importPriceIdr ?? variant.price ?? 0,
      dozenIdr: variant.importDozenPriceIdr ?? null,
    };
  }

  return {
    singleIdr: variant.price ?? 0,
    dozenIdr: variant.dozenPrice ?? null,
  };
}

// Pure helper: compute a custom-quantity total in raw IDR by combining the
// dozen price and the single price. When no dozen price exists, every unit is
// charged at the single price.
function computeCustomTotal({ singlePrice, dozenPrice, quantity }) {
  const n = Math.max(1, Math.floor(Number(quantity) || 1));
  const single = Number(singlePrice) || 0;

  if (typeof dozenPrice === "number" && Number.isFinite(dozenPrice) && dozenPrice > 0) {
    const dozens = Math.floor(n / 12);
    const remainder = n % 12;
    return dozens * dozenPrice + remainder * single;
  }

  return n * single;
}

function getVariantPrice(variant, quantity, priceType = "import") {
  if (!variant) return 0;

  if (quantity === WHOLESALE_QUANTITY) return null;

  // Prices are kept internally in IDR; the import branch reads the raw-IDR
  // fields so the selected display currency can convert them live, while the
  // local branch always stays in IDR.
  if (quantity === 12 && priceType === "import" && variant.importDozenPriceIdr !== null && variant.importDozenPriceIdr !== undefined) {
    return variant.importDozenPriceIdr;
  }
  
  if (quantity === 12 && priceType === "local" && variant.dozenPrice !== null && variant.dozenPrice !== undefined) {
    return variant.dozenPrice;
  }

  // Custom quantities (any positive integer other than the single/dozen
  // exact-field cases above) are priced dynamically from the raw-IDR single
  // and dozen fields that match the active price type.
  if (typeof quantity === "number" && quantity !== 1) {
    const { singleIdr, dozenIdr } = getRawUnitPrices(variant, priceType);
    return computeCustomTotal({ singlePrice: singleIdr, dozenPrice: dozenIdr, quantity });
  }

  const basePrice = priceType === "import" ? 
    (variant.importPriceIdr ?? variant.price) : 
    variant.price;
    
  return basePrice ?? 0;
}

function getWhatsAppNumber(phoneNumber = "") {
  return phoneNumber.replace(/\D/g, "");
}

export default function SearchProduct({ product = null, locale = "id" }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const text = getTranslations(locale).productDetail;
  const { formatImport } = useCurrency();
  const firstVariant = getFirstVariant(product);
  const [currentProduct] = useState(product);
  const [selectedVariant, setSelectedVariant] = useState(firstVariant);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  // Controlled string backing the custom-quantity <input>, held separately so
  // the field can be transiently empty/invalid while typing without breaking
  // the numeric price math.
  const [quantityInput, setQuantityInput] = useState("1");
  // Default price type is always "import" regardless of locale; the user can
  // switch between import and local pricing via the toggle below.
  const [priceType, setPriceType] = useState("import");
  const [selectedPrice, setSelectedPrice] = useState(() =>
    getVariantPrice(firstVariant, 1)
  );

  // Read params from URL and update state (run once on mount and when URL changes)
  useEffect(() => {
    if (!currentProduct || !currentProduct.variants || currentProduct.variants.length === 0) return;

    const variantSize = searchParams.get("variant");
    const quantityParam = searchParams.get("quantity");

    let targetVariant = firstVariant;
    if (variantSize) {
      const variantFromUrl = currentProduct.variants.find((v) => v.size === variantSize);
      if (variantFromUrl) {
        targetVariant = variantFromUrl;
      }
    }

    let targetQuantity = 1;
    if (quantityParam) {
      const parsedQuantity =
        quantityParam === WHOLESALE_QUANTITY
          ? WHOLESALE_QUANTITY
          : parseInt(quantityParam, 10);
      targetQuantity = getValidQuantity(parsedQuantity, targetVariant);
    }

    // Only update state if values actually changed (compare by size, not object reference)
    const currentVariantSize = selectedVariant?.size;
    const targetVariantSize = targetVariant?.size;
    
    if (currentVariantSize !== targetVariantSize || selectedQuantity !== targetQuantity) {
      setSelectedVariant(targetVariant);
      setSelectedQuantity(targetQuantity);
      setSelectedPrice(getVariantPrice(targetVariant, targetQuantity, priceType));
    }
    // priceType intentionally omitted: the price toggle recomputes selectedPrice
    // in the effect below without re-running URL reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct, searchParams, firstVariant]); // Removed selectedVariant, selectedQuantity from deps to avoid loops

  useEffect(() => {
    if (!selectedVariant) return;
    setSelectedPrice(getVariantPrice(selectedVariant, selectedQuantity, priceType));
  }, [selectedVariant, selectedQuantity, priceType]);

  // Keep the visible custom-quantity field in sync when the quantity changes
  // from a badge click, a URL load, or a single/dozen selection. The input is
  // disabled in wholesale mode, so leave it untouched there.
  useEffect(() => {
    if (selectedQuantity !== WHOLESALE_QUANTITY) {
      setQuantityInput(String(selectedQuantity));
    }
  }, [selectedQuantity]);

  // Update URL when user makes a selection change
  const updateUrlForSelection = (variant, quantity) => {
    const params = new URLSearchParams();
    
    // Always include variant in URL
    if (variant?.size) {
      params.set('variant', variant.size);
    }
    
    // Include quantity if not default (1)
    if (quantity !== 1) {
      if (quantity === WHOLESALE_QUANTITY) {
        params.set('quantity', WHOLESALE_QUANTITY);
      } else {
        params.set('quantity', quantity.toString());
      }
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  function getTagTitleText(product, variant, quantity) {
    if (!product || !variant) return product?.title || "";
    const variantSize = typeof variant === "object" ? variant?.size : variant;
    let quantityText = "";

    if (quantity === "12") {
      quantityText = ` - ${text.dozenSuffix}`;
    }

    if (quantity === "wholesale") {
      quantityText = ` - ${text.wholesaleSuffix}`;
    }

    return `${product.title} - ${variantSize}${quantityText}`;
  }

  const changePrice = (quantityOption = 1, variant = null) => {
    const targetVariant = variant || selectedVariant;
    const targetQuantity = getValidQuantity(quantityOption, targetVariant);

    setSelectedVariant(targetVariant);
    setSelectedQuantity(targetQuantity);
    setSelectedPrice(getVariantPrice(targetVariant, targetQuantity, priceType));
    updateUrlForSelection(targetVariant, targetQuantity);
  };

  const onCustomQuantityChange = (e) => {
    const raw = e.target.value;
    setQuantityInput(raw);

    // Allow the field to be cleared mid-edit without resetting the price;
    // keep the last valid quantity until a valid number is entered.
    if (raw === "") return;

    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) {
      changePrice(n, selectedVariant);
    }
  };

  if (!currentProduct || !selectedVariant) {
    return <Loading />;
  }

  const isWholesale = selectedQuantity === WHOLESALE_QUANTITY;
  // All amounts here are raw IDR. The import branch renders them in the
  // selected display currency via formatImport; the local branch always
  // renders them in IDR via formatCurrency.
  const formatActivePrice = (amountIdr) =>
    priceType === "import"
      ? formatImport(amountIdr)
      : formatCurrency(amountIdr, "IDR");
  // Strike-through reference: raw-IDR fromPrice for the import branch, the
  // preserved IDR reference (fromPriceLocal) for the local branch.
  const activeFromPrice =
    priceType === "import"
      ? selectedVariant.fromPriceIdr ?? selectedVariant.fromPrice
      : selectedVariant.fromPriceLocal ?? selectedVariant.fromPrice;
  const fromPriceTotal = isWholesale
    ? 0
    : selectedQuantity * (activeFromPrice || 0);
  // Discount ratio is computed on IDR totals (currency-independent).
  const discountPercentage =
    !isWholesale && fromPriceTotal > 0
      ? Math.round(((fromPriceTotal - selectedPrice) / fromPriceTotal) * 100)
      : 0;

  const tagTitle = getTagTitleText(currentProduct, selectedVariant, selectedQuantity);
  const selectedQuantityText = isWholesale
    ? text.wholesaleSuffix
    : selectedQuantity === 1
      ? text.single
      : selectedQuantity === 12
        ? text.dozenSuffix
        : `${selectedQuantity} ${text.pieceSuffix}`;
  const selectedPriceText = isWholesale
    ? text.wholesalePriceText
    : formatActivePrice(selectedPrice);
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
              src={getProductImageSrc(selectedVariant.picture)}
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
              {formatActivePrice(selectedPrice)}{" "}
              <DiscountBadge
                discountPercentage={discountPercentage}
                isLarge={true}
              />{" "}
              <span className="searchProduct-fromPrice">
                {formatActivePrice(fromPriceTotal)}
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
            <strong>{text.priceTypeLabel}</strong>
          </p>

          <div className="searchProduct-badge-box">
            <span
              className={`searchProduct-badge ${
                priceType === "import" ? "selected" : ""
              }`}
              onClick={() => setPriceType("import")}
            >
              {text.importPrice}
            </span>
            <span
              className={`searchProduct-badge ${
                priceType === "local" ? "selected" : ""
              }`}
              onClick={() => setPriceType("local")}
            >
              {text.localPrice}
            </span>
          </div>

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

          <div className="searchProduct-badge-box">
            <label className="searchProduct-quantity-label">
              {text.customQuantityLabel}
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                className="searchProduct-quantity-input"
                value={isWholesale ? "" : quantityInput}
                onChange={onCustomQuantityChange}
                disabled={isWholesale}
                placeholder={text.customQuantityPlaceholder}
                aria-label={text.customQuantityLabel}
              />
            </label>
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
                  src={getProductImageSrc(variant.picture)}
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

