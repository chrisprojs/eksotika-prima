import NewsCard from "@/components/newsCard/page";
import { getPublishedNewsList } from "@/app/api/news/newsService";
import ShopSection from "@/components/shopSection/page";
import { getTranslations } from "@/lib/i18n";
import "@/app/news/page.css";

export default async function NewsListPage({ locale = "id" }) {
  const newsList = await getPublishedNewsList(locale);
  const text = getTranslations(locale).news;

  return (
    <>
      <main className="page-container news-list-page">
        <section className="news-list-header">
          <h1>{text.heading}</h1>
          <p>{text.listDescription}</p>
        </section>

        {newsList.length === 0 ? (
          <p className="news-empty">{text.empty}</p>
        ) : (
          <section className="news-list-grid">
            {newsList.map((news) => (
              <NewsCard news={news} key={news.newsId} locale={locale} />
            ))}
          </section>
        )}
      </main>
      <div className="page-container page-grey">
        <ShopSection locale={locale}/>
      </div>
    </>
  );
}
