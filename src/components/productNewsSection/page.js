import NewsCard from "@/components/newsCard/page";
import { getLatestNewsByProductId } from "@/app/api/news/newsService";
import { getTranslations } from "@/lib/i18n";
import "./page.css";

export default async function ProductNewsSection({ productId, locale = "id" }) {
  const newsList = await getLatestNewsByProductId(productId, locale);
  const text = getTranslations(locale).news;

  if (newsList.length === 0) {
    return null;
  }

  return (
    <section className="product-news-section">
      <div className="product-news-header">
        <p className="page-heading">{text.productSectionHeading}</p>
        <p className="product-news-text">{text.productSectionText}</p>
      </div>
      <div className="product-news-grid">
        {newsList.map((news) => (
          <NewsCard news={news} key={news.newsId} locale={locale} />
        ))}
      </div>
    </section>
  );
}
