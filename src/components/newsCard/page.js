import Link from "next/link";
import "./page.css";

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function NewsCard({ news }) {
  const relatedProductCount = news.products?.length ?? 0;

  return (
    <Link href={`/news/${news.slug}`} className="news-card">
      {news.coverImage ? (
        <img src={news.coverImage} alt={news.title} className="news-card-image" />
      ) : null}
      <div className="news-card-body">
        <p className="news-card-date">{formatDate(news.createdAt)}</p>
        <h2>{news.title}</h2>
        <p>{news.summary}</p>
        <span>{relatedProductCount} produk terkait</span>
      </div>
    </Link>
  );
}