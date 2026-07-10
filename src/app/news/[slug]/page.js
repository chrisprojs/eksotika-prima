import NewsDetailPage, {
  generateNewsDetailMetadata,
} from "@/app/news/[slug]/NewsDetailPage";

export const revalidate = 1800;

export async function generateMetadata(props) {
  return generateNewsDetailMetadata({ ...props, locale: "id" });
}

export default async function NewsDetail(props) {
  return <NewsDetailPage {...props} locale="id" />;
}