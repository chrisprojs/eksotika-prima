import HomePage from "@/app/HomePage";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const revalidate = 600;

const meta = getTranslations("en").meta.home;
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
    description: meta.openGraphDescription,
    url: `${siteUrl}/en`,
    siteName: "Eksotika Prima",
    type: "website",
    images: [
      {
        url: imageUrl,
        alt: "Eksotika Prima rubbing oil supplier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.openGraphDescription,
    images: [imageUrl],
  },
  alternates: getMetadataAlternates("/", "en"),
};

export default function EnglishHome() {
  return <HomePage locale="en" />;
}