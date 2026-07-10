import { notFound } from "next/navigation";
import { getProductById } from "@/app/api/products/productService";
import SearchProductClient from "@/app/product/[productId]/SearchProductClient";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";
import ProductNewsSection from "@/components/productNewsSection/page";
import {
  getLocalizedUrl,
  getMetadataAlternates,
  getTranslations,
} from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

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

  const getTitleText = (productItem, variant, quantityOption) => {
    if (!productItem || !variant) return "";
    const quantityText =
      quantityOption !== "1"
        ? " - " + (quantityOption === "12" ? text.dozenSuffix : "")
        : "";
    return `${productItem.title} - ${variant}${quantityText}`;
  };

  const variant = query?.variant || product.variants[0]?.size;
  const quantity = query?.quantity;

  const title = getTitleText(product, variant, quantity);
  const description = product.detail;
  const selectedVariant = product.variants.find((item) => item.size === variant) || product.variants[0];
  const image = selectedVariant
    ? `${siteUrl}/api/images/product/${selectedVariant.picture}`
    : `${siteUrl}/favicon.ico`;
  const pagePath = `/product/${productId}`;

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
      <div className="page-container">
        <ProductNewsSection productId={resolvedParams.productId} locale={locale}/>
      </div>
      <div className="page-container page-grey">
        <ShopSection locale={locale}/>
      </div>
      <div className="page-container">
        <TestimoniSection locale={locale}/>
      </div>
    </>
  );
}
