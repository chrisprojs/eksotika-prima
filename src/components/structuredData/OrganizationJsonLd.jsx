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
    legalName: "Eksotika Prima",
    alternateName: ["Eksotika Prima Official", "Eksotikaprima"],
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      "@id": `${siteUrl}#logo`,
      url: `${siteUrl}/asset/logo.jpg`,
    },
    image: `${siteUrl}/asset/logo.jpg`,
    description: meta.description,
    brand: {
      "@type": "Brand",
      "@id": `${siteUrl}#brand`,
      name: "Eksotika Prima",
      logo: `${siteUrl}/asset/logo.jpg`,
    },
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
    // sameAs points to the brand's official marketplace stores so search
    // engines can resolve the brand entity to this domain as the official site.
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
    alternateName: "Eksotika Prima Official Website",
    inLanguage:
      normalizeLocale(locale) === "en" ? "en-US" : "id-ID",
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
    // Declares this domain as the authoritative website of the organization,
    // and enables the sitelinks search box.
    about: {
      "@id": `${siteUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/product?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
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
