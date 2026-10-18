import ProductClient from "./ProductClient";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const meta = getTranslations("id").meta.product;
const imageUrl = `${siteUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: `${siteUrl}/product`,
    type: "website",
    images: [
      {
        url: imageUrl,
        alt: meta.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.twitterDescription,
    images: [imageUrl],
  },
  alternates: getMetadataAlternates("/product", "id"),
};

export default function ProductPage() {
  return <ProductClient locale="id" />;
}