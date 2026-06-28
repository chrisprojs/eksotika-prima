import Link from "next/link";
import NewsCard from "@/components/newsCard/page";
import { getNewsSectionByCategory } from "@/app/api/news/newsService";
import "./page.css";

function NewsGroup({ title, newsList }) {
  if (newsList.length === 0) {
    return null;
  }

  return (
    <section className="news-section-group">
      <div className="news-section-group-header">
        <h3>{title}</h3>
        <Link href="/news">Lihat semua</Link>
      </div>
      <div className="news-section-grid">
        {newsList.map((news) => (
          <NewsCard news={news} key={news.newsId} />
        ))}
      </div>
    </section>
  );
}

export default async function NewsSection() {
  const { educationNews, crazyNews } = await getNewsSectionByCategory();

  if (educationNews.length === 0 && crazyNews.length === 0) {
    return null;
  }

  return (
    <section className="news-section">
      <div className="news-section-header">
        <p className="page-heading">Berita Terbaru</p>
        <p className="news-section-text">Baca info edukasi dan berita gokil terbaru dari Eksotika Prima.</p>
      </div>
      <NewsGroup title="Edukasi" newsList={educationNews} />
      <NewsGroup title="Berita Gokil" newsList={crazyNews} />
    </section>
  );
}
