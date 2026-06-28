import { getProductById } from "@/app/api/products/productService";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { productId } = await params;

  try {
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error getting product by id:", error);
    return NextResponse.json({ error: "Error getting product by id" }, { status: 500 });
  }
}
