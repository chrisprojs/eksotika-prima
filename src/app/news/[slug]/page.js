import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedNewsBySlug } from "@/app/api/news/newsService";
import { cleanNewsHtml } from "@/lib/newsHtml";
import { apiUrl, siteUrl } from "@/lib/site";
import "./page.css";

export const dynamic = "force-dynamic";

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatRupiah(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace(/\s+/g, "");
}

function getProductPrice(product) {
  const prices = product.variants.map((variant) => variant.price);
  if (prices.length === 0) return "Harga belum tersedia";

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return minPrice === maxPrice
    ? formatRupiah(minPrice)
    : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug);

  if (!news) {
    return {
      title: "Berita Tidak Ditemukan | Eksotika Prima",
      description: "Berita tidak tersedia atau sudah dihapus.",
    };
  }

  return {
    metadataBase: new URL(siteUrl),
    title: `${news.title} | Eksotika Prima`,
    description: news.summary,
    openGraph: {
      title: news.title,
      description: news.summary,
      type: "article",
      url: `${siteUrl}/news/${news.slug}`,
      images: news.coverImage ? [{ url: news.coverImage, alt: news.title }] : [],
    },
    alternates: {
      canonical: `${siteUrl}/news/${news.slug}`,
    },
  };
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug);

  if (!news) {
    notFound();
  }

  const relatedProducts = news.products.map((item) => item.product);

  return (
    <main className="page-container news-detail-page">
      <article className="news-detail-main">
        <Link href="/news" className="news-back-link">Kembali ke berita</Link>
        <p className="news-detail-date">{formatDate(news.createdAt)}</p>
        <h1>{news.title}</h1>
        <p className="news-detail-summary">{news.summary}</p>

        {news.coverImage ? (
          <img src={news.coverImage} alt={news.title} className="news-detail-cover" />
        ) : null}

        <div
          className="news-html-content"
          dangerouslySetInnerHTML={{ __html: cleanNewsHtml(news.contentHtml) }}
        />
      </article>

      <aside className="news-product-panel" aria-label="Produk terkait">
        <h2>Produk terkait</h2>
        {relatedProducts.length === 0 ? (
          <p className="news-product-empty">Belum ada produk terkait.</p>
        ) : (
          <div className="news-product-list">
            {relatedProducts.map((product) => {
              const firstVariant = product.variants[0];
              const imageUrl = firstVariant
                ? `${apiUrl}/images/product/${firstVariant.picture}`
                : "/favicon.ico";

              return (
                <Link href={`/product/${product.productId}`} className="news-product-card" key={product.productId}>
                  <img src={imageUrl} alt={product.title} className="news-product-image" />
                  <div>
                    <h3>{product.title}</h3>
                    <p>{getProductPrice(product)}</p>
                    <span>Lihat produk</span>
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
