import ProductDetailPage, {
  generateProductDetailMetadata,
} from "@/app/product/[productId]/ProductDetailPage";

export const revalidate = 1800;

export async function generateMetadata(props) {
  return generateProductDetailMetadata({ ...props, locale: "id" });
}

export default async function SearchProduct(props) {
  return <ProductDetailPage {...props} locale="id" />;
}