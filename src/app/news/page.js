import NewsCard from "@/components/newsCard/page";
import { getPublishedNewsList } from "@/app/api/news/newsService";
import { siteUrl } from "@/lib/site";
import "./page.css";
import ShopSection from "@/components/shopSection/page";

export const revalidate = 300;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Berita | Eksotika Prima",
  description: "Baca berita dan info produk dari Eksotika Prima.",
  alternates: {
    canonical: `${siteUrl}/news`,
  },
};

export default async function NewsPage() {
  const newsList = await getPublishedNewsList();

  return (
    <>
      <main className="page-container news-list-page">
        <section className="news-list-header">
          <h1>Berita</h1>
          <p>Info terbaru, tips, dan cerita produk dari Eksotika Prima.</p>
        </section>

        {newsList.length === 0 ? (
          <p className="news-empty">Belum ada berita.</p>
        ) : (
          <section className="news-list-grid">
            {newsList.map((news) => (
              <NewsCard news={news} key={news.newsId} />
            ))}
          </section>
        )}
      </main>
      <div className='page-container page-grey'>
        <ShopSection/>
      </div>
    </>
  );
}
