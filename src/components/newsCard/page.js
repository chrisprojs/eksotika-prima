import Link from "next/link";
import { formatLocalizedDate, getLocalizedPath, getTranslations } from "@/lib/i18n";
import "./page.css";

export default function NewsCard({ news, locale = "id" }) {
  const relatedProductCount = news.products?.length ?? 0;
  const text = getTranslations(locale).news;

  return (
    <Link href={getLocalizedPath(`/news/${news.slug}`, locale)} className="news-card">
      {news.coverImage ? (
        <img src={news.coverImage} alt={news.title} className="news-card-image" />
      ) : null}
      <div className="news-card-body">
        <p className="news-card-date">{formatLocalizedDate(news.createdAt, locale)}</p>
        <h2>{news.title}</h2>
        <p>{news.summary}</p>
        <span>{text.relatedProductCount(relatedProductCount)}</span>
      </div>
    </Link>
  );
}