import { getLatestNewsByProductId } from "@/app/api/news/newsService";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { productId } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "id";

  try {
    const newsList = await getLatestNewsByProductId(productId, locale);
    return NextResponse.json(newsList);
  } catch (error) {
    console.error("Error getting product news:", error);
    return NextResponse.json([], { status: 500 });
  }
}
