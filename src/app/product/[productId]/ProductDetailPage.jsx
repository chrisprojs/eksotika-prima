import { notFound } from "next/navigation";
import { getProductById } from "@/app/api/products/productService";
import SearchProductClient from "@/app/product/[productId]/SearchProductClient";
import ProductNewsSection from "@/components/productNewsSection/page";
import ExportShippingSection from "@/components/exportShippingSection/page";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";
import {
  getMetadataAlternates,
  getLocalizedUrl,
  getTranslations,
  normalizeLocale,
} from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
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
  const description =
    normalizeLocale(locale) === "en"
      ? `${title} ${variantSize} from ${brand}. Produced by ${producer}. Available at Eksotika Prima with safe packing and wholesale order support.`
      : `${title} ${variantSize} dari ${brand}. Produksi ${producer}. Tersedia di Eksotika Prima dengan packing aman dan harga grosir.`;

  return shortenDescription(description);
}

function getProductImageUrl(picture) {
  return encodeURI(`${siteUrl}/api/images/product/${picture}`);
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

  const requestedVariant = getSingleSearchParam(query?.variant);
  const selectedVariant =
    product.variants.find((variant) => variant.size === requestedVariant) ||
    product.variants[0];
  const requestedQuantity = getSingleSearchParam(query?.quantity);
  const quantity =
    requestedQuantity === "12" || requestedQuantity === "wholesale"
      ? requestedQuantity
      : "1";
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
    },
    alternates: getMetadataAlternates(pagePath, locale),
  };
}

export default async function ProductDetailPage({ params, locale = "id" }) {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.productId, locale);

  if (!product) {
    notFound();
  }

  return (
    <>
      <SearchProductClient product={product} locale={locale} />
      <div className="page-container page-grey">
        <ExportShippingSection locale={locale} />
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