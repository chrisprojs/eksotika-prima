// app/product/[productId]/page.jsx
import { getProductById } from "@/fetch/getProductById";
import SearchProductClient from "./SearchProductClient";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";

export async function generateMetadata({ params, searchParams }) {
  const { productId } = params;

  const product = await getProductById(productId);

  if (!product) {
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

  const variant = searchParams.variant || product.variants[0]?.size;
  const quantity = searchParams.quantity;

  const title = getTitleText(product, variant, quantity);
  const description = product.detail;
  const image = `${process.env.NEXT_PUBLIC_API_URL}/images/product/${product.title}/${searchParams.variant}`;

  const baseUrl = process.env.NEXT_PUBLIC_URL
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
  return (
  <>
    <SearchProductClient params={params} />
    <div className='page-container page-grey'>
      <ShopSection/>
    </div>
    <div className="page-container">
      <TestimoniSection/>
    </div>
  </>
  );
}
