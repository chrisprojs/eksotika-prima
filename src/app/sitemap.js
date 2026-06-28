import { getSitemapNewsList } from "@/app/api/news/newsService";
import { getSitemapProducts } from "@/app/api/products/productService";
import { siteUrl } from "@/lib/site";

export default async function sitemap() {
  const buildTime = new Date();

  let products = [];
  let newsList = [];

  try {
    products = await getSitemapProducts();
  } catch (error) {
    console.error("Failed to build product sitemap:", error);
  }

  newsList = await getSitemapNewsList(buildTime);

  const latestNewsDate = newsList[0]?.updatedAt || newsList[0]?.createdAt;
  const homepageLastModified = latestNewsDate || buildTime;
  const latestProductDate = products[0]?.updatedAt ?? buildTime;
  const newsPageLastModified = latestNewsDate || buildTime;

  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: homepageLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/product`,
      lastModified: latestProductDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: newsPageLastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${siteUrl}/product/${product.productId}`,
      lastModified: product.updatedAt || product.createdAt,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    ...newsList.map((news) => ({
      url: `${siteUrl}/news/${news.slug}`,
      lastModified: news.updatedAt || news.createdAt,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
