import { getLlmsNewsList } from "@/app/api/news/newsService";
import { getSitemapProducts } from "@/app/api/products/productService";
import {
  getNewsSupportedLocales,
  getProductSupportedLocales,
  localizeNews,
  localizeProduct,
} from "@/lib/dbLocalization";
import { htmlToPlainText } from "@/lib/newsHtml";
import {
  defaultLocale,
  englishLocale,
  getLocalizedUrl,
  locales,
} from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

// Order of preference for the description/summary text: English first, then the
// default locale, so AI readers always get the English copy when it exists.
const descriptionLocalePreference = [englishLocale, defaultLocale];

const localeLabels = {
  id: "Indonesian",
  en: "English",
};

const DESCRIPTION_MAX_LENGTH = 280;

const HEADER = `# Eksotika Prima

> Indonesia's Largest Massage Oil Supplier. Retail, wholesale, and international shipping. Official website of the Eksotika Prima brand.

Eksotika Prima is one of Indonesia's largest suppliers of traditional Indonesian rub, massage, and herbal body-care oils. We serve personal customers, shops, resellers, and wholesale buyers, with support for international shipping.

Canonical URL: ${siteUrl}

## Summary

- **Business:** Eksotika Prima supplies massage oil and herbal body care oil for personal use, shops, resellers, and wholesale buyers. We help customers get quality products with low prices, safe packing, and fast service. Our products are made with good quality standards and selected herbal ingredients that are well known in Indonesian traditional care. This makes Eksotika Prima a trusted choice for customers who want natural body care products.
- **Customers:** Personal buyers, retail shops, resellers, and wholesale/bulk buyers, within Indonesia and internationally.
- **Offering:** Competitive and negotiable wholesale pricing, safe packing, and fast service. Prices can be discussed for large orders.
- **International shipping:** Supports export to the USA, Europe, Australia, Southeast Asia, East Asia, the Middle East, Africa, Latin America, and other regions, subject to shipping rules.
- **Location:** Metro Indah III Blok.C No.31A RT.1/RW.4, Papanggo, Tanjung Priok, Jakarta Utara, DKI Jakarta, 14340, Indonesia.
- **Ordering:** Primarily via WhatsApp listed on the website; also available on Tokopedia, Shopee, and Blibli.
- **Languages:** The website is published in Indonesian (at ${siteUrl}/) and English (at ${siteUrl}/en).

## Languages

- [Indonesian site](${getLocalizedUrl("/", "id")})
- [English site](${getLocalizedUrl("/", "en")})

## Key sections

${locales
  .map((locale) => {
    const label = localeLabels[locale] || locale;
    return [
      `- [Products (${label})](${getLocalizedUrl("/product", locale)}): Full catalog of massage and rub oils with variants and sizes.`,
      `- [News (${label})](${getLocalizedUrl("/news", locale)}): News from Eksotika Prima with tips and update.`,
      `- [Contact (${label})](${getLocalizedUrl("/contact", locale)}): Address, phone, WhatsApp, and marketplace stores.`,
    ].join("\n");
  })
  .join("\n")}`;

function cleanInline(value) {
  // Collapse whitespace/newlines so each entry stays on a single markdown line.
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toDescription(value) {
  // Strip HTML to plain text, collapse whitespace, and truncate to keep each
  // entry concise while still giving the AI meaningful context.
  const text = cleanInline(htmlToPlainText(String(value || "")));

  if (!text) {
    return "";
  }

  if (text.length <= DESCRIPTION_MAX_LENGTH) {
    return text;
  }

  const truncated = text.slice(0, DESCRIPTION_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function pickDescriptionLocale(supportedLocales, hasText) {
  // Prefer English, then the default locale, choosing only locales that both
  // the record supports and that actually produce non-empty description text.
  const preferred = descriptionLocalePreference.find(
    (locale) => supportedLocales.includes(locale) && hasText(locale)
  );
  if (preferred) {
    return preferred;
  }

  // Fall back to any supported locale that has text, else the first supported.
  return supportedLocales.find((locale) => hasText(locale)) || supportedLocales[0];
}

function buildProductSection(products) {
  const entries = products
    .map((product) => {
      const supportedLocales = getProductSupportedLocales(product);
      if (supportedLocales.length === 0) {
        return null;
      }

      const links = supportedLocales
        .map((locale) => {
          const localized = localizeProduct(product, locale);
          const title = cleanInline(localized?.title);
          if (!title) {
            return null;
          }
          const label = localeLabels[locale] || locale;
          const url = getLocalizedUrl(`/product/${product.productId}`, locale);
          return `[${title}](${url}) (${label})`;
        })
        .filter(Boolean)
        .join(" · ");

      if (!links) {
        return null;
      }

      // Describe in English when available, falling back to the default locale.
      const descriptionLocale = pickDescriptionLocale(supportedLocales, (locale) =>
        toDescription(localizeProduct(product, locale)?.detail)
      );
      const localizedForDescription = localizeProduct(product, descriptionLocale);
      const brand = cleanInline(localizedForDescription?.merk);
      const detail = toDescription(localizedForDescription?.detail);
      const descriptionParts = [brand ? `Brand: ${brand}.` : "", detail]
        .filter(Boolean)
        .join(" ");

      return descriptionParts
        ? `- ${links}\n  - ${descriptionParts}`
        : `- ${links}`;
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return null;
  }

  return ["## Products", "", ...entries].join("\n");
}

function buildNewsSection(newsList) {
  const entries = newsList
    .map((news) => {
      const supportedLocales = getNewsSupportedLocales(news);
      if (supportedLocales.length === 0) {
        return null;
      }

      const links = supportedLocales
        .map((locale) => {
          const localized = localizeNews(news, locale);
          const slug = cleanInline(localized?.slug);
          if (!slug) {
            return null;
          }
          const title = cleanInline(localized?.title) || slug;
          const label = localeLabels[locale] || locale;
          return `[${title}](${getLocalizedUrl(`/news/${slug}`, locale)}) (${label})`;
        })
        .filter(Boolean)
        .join(" · ");

      if (!links) {
        return null;
      }

      // Summarize in English when available, falling back to the default locale.
      const descriptionLocale = pickDescriptionLocale(supportedLocales, (locale) =>
        toDescription(localizeNews(news, locale)?.summary)
      );
      const summary = toDescription(
        localizeNews(news, descriptionLocale)?.summary
      );

      return summary ? `- ${links}\n  - ${summary}` : `- ${links}`;
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return null;
  }

  return ["## News articles", "", ...entries].join("\n");
}

export async function GET() {
  const buildTime = new Date();

  const [products, newsList] = await Promise.all([
    getSitemapProducts().catch((error) => {
      console.error("Failed to build llms.txt products:", error);
      return [];
    }),
    getLlmsNewsList(buildTime).catch((error) => {
      console.error("Failed to build llms.txt news:", error);
      return [];
    }),
  ]);

  const sections = [
    HEADER,
    buildProductSection(products),
    buildNewsSection(newsList),
    [`## Reference`, "", `- [Sitemap](${siteUrl}/sitemap.xml)`].join("\n"),
  ].filter(Boolean);

  const body = `${sections.join("\n\n")}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
