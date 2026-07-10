import HomePage from "@/app/HomePage";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const revalidate = 600;

const meta = getTranslations("id").meta.home;
const imageUrl = `${siteUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  keywords: [
    "supplier minyak gosok",
    "minyak gosok murah",
    "pabrik minyak gosok",
    "grosir minyak gosok",
    "minyak gosok terbesar",
    "Eksotika Prima",
    "minyak urut",
    "minyak pijat",
  ],
  openGraph: {
    title: meta.title,
    description: meta.openGraphDescription,
    url: siteUrl,
    siteName: "Eksotika Prima",
    type: "website",
    images: [
      {
        url: imageUrl,
        alt: "Supplier Minyak Gosok Terbesar - Eksotika Prima",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.openGraphDescription,
    images: [imageUrl],
  },
  alternates: getMetadataAlternates("/", "id"),
};

export default function Home() {
  return <HomePage locale="id" />;
}