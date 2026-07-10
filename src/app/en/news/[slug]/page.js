import NewsDetailPage, {
  generateNewsDetailMetadata,
} from "@/app/news/[slug]/NewsDetailPage";

export const revalidate = 300;

export async function generateMetadata(props) {
  return generateNewsDetailMetadata({ ...props, locale: "en" });
}

export default async function EnglishNewsDetail(props) {
  return <NewsDetailPage {...props} locale="en" />;
}