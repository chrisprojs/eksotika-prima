import Link from "next/link";
import NewsCard from "@/components/newsCard/page";
import { getNewsSectionByCategory } from "@/app/api/news/newsService";
import { getLocalizedPath, getTranslations } from "@/lib/i18n";
import "./page.css";

function NewsGroup({ title, newsList, locale }) {
  const text = getTranslations(locale).news;

  if (newsList.length === 0) {
    return null;
  }

  return (
    <section className="news-section-group">
      <div className="news-section-group-header">
        <h3>{title}</h3>
        <Link href={getLocalizedPath("/news", locale)}>{text.readAll}</Link>
      </div>
      <div className="news-section-grid">
        {newsList.map((news) => (
          <NewsCard news={news} key={news.newsId} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export default async function NewsSection({ locale = "id" }) {
  const { educationNews, crazyNews } = await getNewsSectionByCategory(locale);
  const text = getTranslations(locale).news;

  if (educationNews.length === 0 && crazyNews.length === 0) {
    return null;
  }

  return (
    <section className="news-section">
      <div className="news-section-header">
        <p className="page-heading">{text.latestHeading}</p>
        <p className="news-section-text">{text.sectionText}</p>
      </div>
      <NewsGroup title={text.education} newsList={educationNews} locale={locale} />
      <NewsGroup title={text.crazyNews} newsList={crazyNews} locale={locale} />
    </section>
  );
}
