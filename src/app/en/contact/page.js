import ContactPage from "@/app/contact/ContactPage";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const meta = getTranslations("en").meta.contact;
const imageUrl = `${siteUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: `${siteUrl}/en/contact`,
    siteName: "Eksotika Prima",
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
    description: meta.description,
    images: [imageUrl],
  },
  alternates: getMetadataAlternates("/contact", "en"),
};

export default function EnglishContact() {
  return <ContactPage locale="en" />;
}