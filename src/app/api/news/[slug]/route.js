import { getPublishedNewsBySlug } from "@/app/api/news/newsService";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "id";

  try {
    const news = await getPublishedNewsBySlug(slug, locale);

    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error getting news by slug:", error);
    return NextResponse.json({ error: "Error getting news" }, { status: 500 });
  }
}
