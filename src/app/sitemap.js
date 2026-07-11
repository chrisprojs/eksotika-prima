import { getSitemapNewsList } from "@/app/api/news/newsService";
import { getSitemapProducts } from "@/app/api/products/productService";
import { getLocalizedUrl, locales } from "@/lib/i18n";
import {
  getNewsSupportedLocales,
  getProductSupportedLocales,
  localizeNews,
} from "@/lib/dbLocalization";

export const revalidate = 300;

const localeLanguageMap = {
  id: "id-ID",
  en: "en-US",
};

function alternatesForLocalizedPaths(localizedPaths) {
  return {
    languages: Object.fromEntries(
      Object.entries(localizedPaths).map(([locale, path]) => [
        localeLanguageMap[locale],
        getLocalizedUrl(path, locale),
      ])
    ),
  };
}

function sitemapAlternates(path) {
  const localizedPaths = Object.fromEntries(
    locales.map((locale) => [locale, path])
  );

  return alternatesForLocalizedPaths(localizedPaths);
}

function localizedSitemapEntries(path, options = {}) {
  return locales.map((locale) => ({
    url: getLocalizedUrl(path, locale),
    ...options,
    alternates: sitemapAlternates(path),
  }));
}

function localizedProductSitemapEntries(product) {
  const supportedLocales = getProductSupportedLocales(product);
  const localizedPaths = Object.fromEntries(
    supportedLocales.map((locale) => [locale, `/product/${product.productId}`])
  );

  return supportedLocales.map((locale) => ({
    url: getLocalizedUrl(localizedPaths[locale], locale),
    changeFrequency: "monthly",
    priority: 0.7,
    alternates: alternatesForLocalizedPaths(localizedPaths),
  }));
}

function localizedNewsSitemapEntries(news) {
  const supportedLocales = getNewsSupportedLocales(news);
  const localizedPaths = Object.fromEntries(
    supportedLocales.map((locale) => {
      const localizedNews = localizeNews(news, locale);
      return [locale, `/news/${localizedNews.slug}`];
    })
  );

  return supportedLocales.map((locale) => ({
    url: getLocalizedUrl(localizedPaths[locale], locale),
    lastModified: news.updatedAt || news.createdAt,
    changeFrequency: "monthly",
    priority: 0.7,
    alternates: alternatesForLocalizedPaths(localizedPaths),
  }));
}

export default async function sitemap() {
  const buildTime = new Date();

  const [products, newsList] = await Promise.all([
    getSitemapProducts().catch((error) => {
      console.error("Failed to build product sitemap:", error);
      return [];
    }),
    getSitemapNewsList(buildTime),
  ]);

  const latestNewsDate = newsList[0]?.updatedAt || newsList[0]?.createdAt;
  const homepageLastModified = latestNewsDate || buildTime;
  const newsPageLastModified = latestNewsDate || buildTime;

  const staticRoutes = [
    ...localizedSitemapEntries("/", {
      lastModified: homepageLastModified,
      changeFrequency: "weekly",
      priority: 1,
    }),
    ...localizedSitemapEntries("/product", {
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...localizedSitemapEntries("/news", {
      lastModified: newsPageLastModified,
      changeFrequency: "daily",
      priority: 0.8,
    }),
    ...localizedSitemapEntries("/contact", {
      changeFrequency: "yearly",
      priority: 0.7,
    }),
  ];

  return [
    ...staticRoutes,
    ...products.flatMap((product) => localizedProductSitemapEntries(product)),
    ...newsList.flatMap((news) => localizedNewsSitemapEntries(news)),
  ];
}
