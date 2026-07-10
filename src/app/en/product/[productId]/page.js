import ProductDetailPage, {
  generateProductDetailMetadata,
} from "@/app/product/[productId]/ProductDetailPage";

export const revalidate = 300;

export async function generateMetadata(props) {
  return generateProductDetailMetadata({ ...props, locale: "en" });
}

export default async function EnglishSearchProduct(props) {
  return <ProductDetailPage {...props} locale="en" />;
}