import { getTranslations, normalizeLocale } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { ContactInformation } from "@/data/ContactInformation";

function stringifyJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function getOrganizationJsonLd(locale) {
  const meta = getTranslations(locale).meta.home;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "Eksotika Prima",
    url: siteUrl,
    logo: `${siteUrl}/asset/logo.jpg`,
    description: meta.description,
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Metro Indah III Blok.C No.31A RT.1/RW.4, Papanggo, Tanjung Priok",
      addressLocality: "Jakarta Utara",
      addressRegion: "DKI Jakarta",
      postalCode: "14340",
      addressCountry: "ID",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: ContactInformation.whatsappNumber,
      contactType: "customer service",
    },
    sameAs: [
      ContactInformation.tokopediaLink,
      ContactInformation.shopeeLink,
      ContactInformation.blibliLink,
    ],
  };
}

function getWebSiteJsonLd(locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "Eksotika Prima",
    inLanguage:
      normalizeLocale(locale) === "en" ? "en-US" : "id-ID",
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
  };
}

export default function OrganizationJsonLd({ locale = "id" }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationJsonLd(locale),
      getWebSiteJsonLd(locale),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: stringifyJsonLd(graph) }}
    />
  );
}
