import NewsDetailPage, {
  generateNewsDetailMetadata,
} from "@/app/news/[slug]/NewsDetailPage";

export const revalidate = 1800;

export async function generateMetadata(props) {
  return generateNewsDetailMetadata({ ...props, locale: "en" });
}

export default async function EnglishNewsDetail(props) {
  return <NewsDetailPage {...props} locale="en" />;
}