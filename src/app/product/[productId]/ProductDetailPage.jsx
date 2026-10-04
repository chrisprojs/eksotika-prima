import { notFound } from "next/navigation";
import { getProductById } from "@/app/api/products/productService";
import SearchProductClient from "@/app/product/[productId]/SearchProductClient";
import ProductNewsSection from "@/components/productNewsSection/page";
import ImportShippingSection from "@/components/importShippingSection/page";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";
import {
  getMetadataAlternates,
  getLocalizedUrl,
  getTranslations,
  normalizeLocale,
} from "@/lib/i18n";
import { htmlToPlainText } from "@/lib/newsHtml";
import { siteUrl } from "@/lib/site";
import { getAbsoluteProductImageSrc } from "@/lib/productImageSrc";
import FaqSection from "@/components/faqSection/page";

function getSingleSearchParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function cleanSentenceEnd(value = "") {
  return cleanText(value).replace(/[.,;:!?]+$/, "");
}

function shortenDescription(value, maxLength = 155) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  const slicedText = text.slice(0, maxLength - 1).trim();
  const lastSpaceIndex = slicedText.lastIndexOf(" ");
  const safeText =
    lastSpaceIndex > 80 ? slicedText.slice(0, lastSpaceIndex) : slicedText;

  return `${safeText.replace(/[.,;:!?-]+$/, "")}.`;
}

function getSelectedProductOptions(product, query = {}) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const requestedVariant = getSingleSearchParam(query?.variant);
  const selectedVariant =
    variants.find((variant) => variant.size === requestedVariant) ||
    variants[0] ||
    null;
  const requestedQuantity = getSingleSearchParam(query?.quantity);
  const quantity =
    requestedQuantity === "12" || requestedQuantity === "wholesale"
      ? requestedQuantity
      : "1";

  return { selectedVariant, quantity };
}

function getTitleText(product, variantSize, quantity, text) {
  if (!product || !variantSize) return product?.title || "";
  let quantityText = "";

  if (quantity === "12") {
    quantityText = ` - ${text.dozenSuffix}`;
  }

  if (quantity === "wholesale") {
    quantityText = ` - ${text.wholesaleSuffix}`;
  }
  return `${product.title} - ${variantSize}${quantityText}`;
}

function getProductDescription(product, variantSize, locale) {
  const title = cleanText(product.title);
  const brand = cleanSentenceEnd(product.merk);
  const producer = cleanSentenceEnd(product.produsen);
  const detailText = cleanSentenceEnd(htmlToPlainText(product.detail));

  if (detailText) {
    return shortenDescription(`${title} ${variantSize}. ${detailText}.`);
  }

  const description =
    normalizeLocale(locale) === "en"
      ? `${title} ${variantSize} from ${brand}. Produced by ${producer}. Available at Eksotika Prima with safe packing and wholesale order support.`
      : `${title} ${variantSize} dari ${brand}. Produksi ${producer}. Tersedia di Eksotika Prima dengan packing aman dan harga grosir.`;

  return shortenDescription(description);
}

function getProductImageUrl(picture) {
  return getAbsoluteProductImageSrc(picture, siteUrl);
}

function getOfferPrice(price) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) && numericPrice > 0
    ? numericPrice
    : null;
}

function getSelectedPrice(variant, quantity) {
  if (!variant) return null;

  if (quantity === "12") {
    return (
      getOfferPrice(variant.importDozenPrice) ??
      getOfferPrice(variant.dozenPrice) ??
      getOfferPrice(variant.importPrice) ??
      getOfferPrice(variant.price)
    );
  }

  return getOfferPrice(variant.importPrice) ?? getOfferPrice(variant.price);
}

function formatOfferPrice(value) {
  // Google requires the price as a number without currency symbols or
  // thousands separators. A string with a decimal point is the safe form.
  return String(value);
}

function getPriceValidUntil() {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  return validUntil.toISOString().split("T")[0];
}

function getProductOffers(product, pagePath, locale, text) {
  const pageUrl = getLocalizedUrl(pagePath, locale);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  // Offer prices are derived from the import price, which follows the locale
  // currency (IDR for Bahasa, USD for English).
  const offerCurrency = product?.importCurrency || "IDR";
  const priceValidUntil = getPriceValidUntil();

  return variants.flatMap((variant) => {
    const baseOffer = {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: offerCurrency,
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    };
    const offers = [];
    const singlePrice = getOfferPrice(variant.importPrice || variant.price);
    const dozenPrice = getOfferPrice(variant.importDozenPrice || variant.dozenPrice);

    if (singlePrice) {
      offers.push({
        ...baseOffer,
        name: `${product.title} - ${variant.size}`,
        sku: `${product.productId}-${variant.size}-1`,
        price: formatOfferPrice(singlePrice),
      });
    }

    if (dozenPrice) {
      offers.push({
        ...baseOffer,
        name: `${product.title} - ${variant.size} - ${text.dozenSuffix}`,
        sku: `${product.productId}-${variant.size}-12`,
        price: formatOfferPrice(dozenPrice),
      });
    }

    return offers;
  });
}

// Builds the `offers` value for the Product schema. Google shows a single
// price in the search snippet. With one offer we emit that Offer directly;
// with several we wrap them in an AggregateOffer so Google has a clear
// low/high price to display (like the "Rp 33.000" line in a rich result).
function buildOffersValue(offers, offerCurrency, pageUrl) {
  if (offers.length === 0) return undefined;
  if (offers.length === 1) return offers[0];

  const prices = offers.map((offer) => Number(offer.price));
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  return {
    "@type": "AggregateOffer",
    url: pageUrl,
    priceCurrency: offerCurrency,
    lowPrice: formatOfferPrice(lowPrice),
    highPrice: formatOfferPrice(highPrice),
    offerCount: offers.length,
    availability: "https://schema.org/InStock",
    offers,
  };
}

function getProductJsonLd({ product, description, pagePath, locale, text }) {
  const images = Array.from(
    new Set(
      (Array.isArray(product?.variants) ? product.variants : [])
        .map((variant) => variant.picture)
        .filter(Boolean)
        .map(getProductImageUrl)
    )
  );
  const pageUrl = getLocalizedUrl(pagePath, locale);
  const offerCurrency = product?.importCurrency || "IDR";
  const offers = getProductOffers(product, pagePath, locale, text);
  const offersValue = buildOffersValue(offers, offerCurrency, pageUrl);
  const brandName = cleanSentenceEnd(product.merk);
  const producerName = cleanSentenceEnd(product.produsen);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    productID: String(product.productId),
    name: cleanText(product.title),
    image: images,
    description,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
        }
      : undefined,
    manufacturer: producerName
      ? {
          "@type": "Organization",
          name: producerName,
        }
      : undefined,
    ...(offersValue ? { offers: offersValue } : {}),
  };
}

function stringifyJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateProductDetailMetadata({
  params,
  searchParams,
  locale = "id",
}) {
  const { productId } = await params;
  const query = await searchParams;
  const text = getTranslations(locale).productDetail;
  const product = await getProductById(productId, locale);

  if (!product || !Array.isArray(product.variants)) {
    return {
      title: text.notFoundTitle,
      description: text.notFoundDescription,
      alternates: getMetadataAlternates(`/product/${productId}`, locale),
    };
  }

  const { selectedVariant, quantity } = getSelectedProductOptions(product, query);
  const pagePath = `/product/${productId}`;
  const title = getTitleText(product, selectedVariant?.size, quantity, text);
  const description = getProductDescription(
    product,
    selectedVariant?.size || "",
    locale
  );
  const image = selectedVariant
    ? getProductImageUrl(selectedVariant.picture)
    : `${siteUrl}/favicon.ico`;
  const price = getSelectedPrice(selectedVariant, quantity);
  const priceCurrency = product.importCurrency || "IDR";
  const hasPrice = price !== null;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: [product.title, product.merk, product.produsen],
    openGraph: {
      title,
      description,
      type: "website",
      url: getLocalizedUrl(pagePath, locale),
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      ...(hasPrice
        ? {
            label1: text.priceLabel || "Price",
            data1: `${priceCurrency} ${price}`,
          }
        : {}),
    },
    ...(hasPrice
      ? {
          other: {
            "product:price:amount": String(price),
            "product:price:currency": priceCurrency,
            "og:price:amount": String(price),
            "og:price:currency": priceCurrency,
          },
        }
      : {}),
    alternates: getMetadataAlternates(pagePath, locale),
  };
}

export default async function ProductDetailPage({ params, searchParams, locale = "id" }) {
  const resolvedParams = await params;
  const query = await searchParams;
  const text = getTranslations(locale).productDetail;
  const product = await getProductById(resolvedParams.productId, locale);

  if (!product) {
    notFound();
  }

  const { selectedVariant } = getSelectedProductOptions(product, query);
  const pagePath = `/product/${resolvedParams.productId}`;
  const description = getProductDescription(
    product,
    selectedVariant?.size || "",
    locale
  );
  const productJsonLd = getProductJsonLd({
    product,
    description,
    pagePath,
    locale,
    text,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(productJsonLd) }}
      />
      <SearchProductClient product={product} locale={locale} />
      <div className="page-container page-grey">
        <ImportShippingSection locale={locale} />
      </div>
      <div className="page-container">
        <ProductNewsSection productId={resolvedParams.productId} locale={locale} />
      </div>
      <div className="page-container page-grey">
        <ShopSection locale={locale} />
      </div>
      <div className="page-container">
        <TestimoniSection locale={locale} />
      </div>
      <div className="page-container page-grey">
        <FaqSection locale={locale}/>
      </div>
    </>
  );
}


