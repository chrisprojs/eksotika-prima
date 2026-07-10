import ProductClient from "@/app/product/ProductClient";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const meta = getTranslations("en").meta.product;
const imageUrl = `${siteUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  keywords: [
    "rubbing oil supplier",
    "cheap rubbing oil",
    "massage oil supplier",
    "wholesale rubbing oil",
    "Eksotika Prima",
    "herbal oil Indonesia",
  ],
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: `${siteUrl}/en/product`,
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
  alternates: getMetadataAlternates("/product", "en"),
};

export default function EnglishProductPage() {
  return <ProductClient locale="en" />;
}