import NewsListPage from "@/app/news/NewsListPage";
import { getMetadataAlternates, getTranslations } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

const meta = getTranslations("en").meta.news;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  alternates: getMetadataAlternates("/news", "en"),
};

export default async function EnglishNewsPage() {
  return <NewsListPage locale="en" />;
}