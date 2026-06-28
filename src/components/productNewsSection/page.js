import NewsCard from "@/components/newsCard/page";
import { getLatestNewsByProductId } from "@/lib/newsData";
import "./page.css";

export default async function ProductNewsSection({ productId }) {
  const newsList = await getLatestNewsByProductId(productId);

  if (newsList.length === 0) {
    return null;
  }

  return (
    <section className="product-news-section">
      <div className="product-news-header">
        <p className="page-heading">Berita Produk Ini</p>
        <p className="product-news-text">Berita terbaru yang berhubungan dengan produk ini.</p>
      </div>
      <div className="product-news-grid">
        {newsList.map((news) => (
          <NewsCard news={news} key={news.newsId} />
        ))}
      </div>
    </section>
  );
}