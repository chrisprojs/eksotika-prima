import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedNewsBySlug } from "@/app/api/news/newsService";
import { localizeNewsHtml } from "@/lib/newsHtml";
import { apiUrl, siteUrl } from "@/lib/site";
import {
  formatIdr,
  formatLocalizedDate,
  getLocalizedPath,
  getLocalizedUrl,
  getMetadataAlternates,
  getTranslations,
} from "@/lib/i18n";
import "@/app/news/[slug]/page.css";

function getProductPrice(product, locale, text) {
  const prices = product.variants.map((variant) => variant.price);
  if (prices.length === 0) return text.priceUnavailable;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return minPrice === maxPrice
    ? formatIdr(minPrice, locale)
    : `${formatIdr(minPrice, locale)} - ${formatIdr(maxPrice, locale)}`;
}

export async function generateNewsDetailMetadata({ params, locale = "id" }) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug, locale);
  const text = getTranslations(locale).news;

  if (!news) {
    return {
      title: text.notFoundTitle,
      description: text.notFoundDescription,
      alternates: getMetadataAlternates(`/news/${slug}`, locale),
    };
  }

  const pagePath = `/news/${news.slug}`;

  return {
    metadataBase: new URL(siteUrl),
    title: `${news.title} | Eksotika Prima`,
    description: news.summary,
    openGraph: {
      title: news.title,
      description: news.summary,
      type: "article",
      url: getLocalizedUrl(pagePath, locale),
      images: news.coverImage ? [{ url: news.coverImage, alt: news.title }] : [],
    },
    alternates: getMetadataAlternates(pagePath, locale),
  };
}

export default async function NewsDetailPage({ params, locale = "id" }) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug, locale);
  const text = getTranslations(locale).news;

  if (!news) {
    notFound();
  }

  const relatedProducts = news.products.map((item) => item.product);

  return (
    <main className="page-container news-detail-page">
      <article className="news-detail-main">
        <Link href={getLocalizedPath("/news", locale)} className="news-back-link">{text.backToNews}</Link>
        <p className="news-detail-date">{formatLocalizedDate(news.createdAt, locale)}</p>
        <h1>{news.title}</h1>
        <p className="news-detail-summary">{news.summary}</p>

        {news.coverImage ? (
          <img src={news.coverImage} alt={news.title} className="news-detail-cover" />
        ) : null}

        <div
          className="news-html-content"
          dangerouslySetInnerHTML={{ __html: localizeNewsHtml(news.contentHtml, locale) }}
        />
      </article>

      <aside className="news-product-panel" aria-label={text.productPanelLabel}>
        <h2>{text.relatedProductsTitle}</h2>
        {relatedProducts.length === 0 ? (
          <p className="news-product-empty">{text.noRelatedProducts}</p>
        ) : (
          <div className="news-product-list">
            {relatedProducts.map((product) => {
              const firstVariant = product.variants[0];
              const imageUrl = firstVariant
                ? `${apiUrl}/images/product/${firstVariant.picture}`
                : "/favicon.ico";

              return (
                <Link href={getLocalizedPath(`/product/${product.productId}`, locale)} className="news-product-card" key={product.productId}>
                  <img src={imageUrl} alt={product.title} className="news-product-image" />
                  <div>
                    <h3>{product.title}</h3>
                    <p>{getProductPrice(product, locale, text)}</p>
                    <span>{text.seeProduct}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </aside>
    </main>
  );
}
