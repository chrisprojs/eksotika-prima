import { NextResponse } from "next/server";
import { getAllProducts, getProductById } from "@/app/api/products/productService";

export async function GET(req) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  const locale = url.searchParams.get("locale") || "id";

  if (productId) {
    try {
      const product = await getProductById(productId, locale);

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json(product);
    } catch (error) {
      console.error("Error getting product by id:", error);
      return NextResponse.json({ error: "Error getting product by id" }, { status: 500 });
    }
  }

  try {
    const products = await getAllProducts(locale);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error getting products:", error);
    return NextResponse.json({ error: "Error getting products" }, { status: 500 });
  }
}
