// app/product/[productId]/page.jsx
import { getProductById } from "@/fetch/getProductById";
import SearchProductClient from "./SearchProductClient";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";
import ProductNewsSection from "@/components/productNewsSection/page";
import { apiUrl, siteUrl } from "@/lib/site";

export async function generateMetadata({ params, searchParams }) {
  const { productId } = await params;
  const query = await searchParams;

  const product = await getProductById(productId);

  if (!product || !Array.isArray(product.variants)) {
    return {
      title: "Produk Tidak Ditemukan",
      description: "Produk tidak tersedia atau telah dihapus.",
    };
  }

  const getTitleText = (product, variant, quantityOption) => {
    if (!product || !variant) return "";
    const quantityText =
      quantityOption !== '1'
        ? " - " + (quantityOption === '12' ? "lusin (12pcs)" : "")
        : "";
    return `${product.title} - ${variant}${quantityText}`;
  };

  const variant = query?.variant || product.variants[0]?.size;
  const quantity = query?.quantity;

  const title = getTitleText(product, variant, quantity);
  const description = product.detail;
  const selectedVariant = product.variants.find((item) => item.size === variant) || product.variants[0];
  const image = selectedVariant
    ? `${apiUrl}/images/product/${selectedVariant.picture}`
    : `${siteUrl}/favicon.ico`;

  const baseUrl = siteUrl;
  return {
    metadataBase: new URL(baseUrl),

    title: title,
    description: description,
    keywords: [product.title, product.merk, product.produsen],

    openGraph: {
      title: title,
      description: description,
      type: "website",
      url: `${baseUrl}/product/${productId}`,
      images: [{ url: image, alt: title }],
    },

    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [image],
    },

    alternates: {
      canonical: `${baseUrl}/product/${productId}`,
    },
  };
}

export default async function SearchProduct({ params }) {
  const resolvedParams = await params;

  return (
  <>
    <SearchProductClient params={resolvedParams} />
    <div className="page-container">
      <ProductNewsSection productId={resolvedParams.productId}/>
    </div>
    <div className='page-container page-grey'>
      <ShopSection/>
    </div>
    <div className="page-container">
      <TestimoniSection/>
    </div>
  </>
  );
}
