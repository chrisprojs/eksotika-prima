import { NextResponse } from "next/server";
import {
  createNews,
  getPublishedNewsBySlug,
  getPublishedNewsList,
  updateNews,
} from "@/app/api/news/newsService";

function validateAdminKey(req) {
  const adminKey = req.headers.get("admin-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY);
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const locale = url.searchParams.get("locale") || "id";
  const now = new Date();

  try {
    if (slug) {
      const news = await getPublishedNewsBySlug(slug, locale, now);

      if (!news) {
        return NextResponse.json({ error: "News not found" }, { status: 404 });
      }

      return NextResponse.json(news);
    }

    const newsList = await getPublishedNewsList(locale, now);
    return NextResponse.json(newsList);
  } catch (error) {
    console.error("Error getting news:", error);
    return NextResponse.json({ error: "Error getting news" }, { status: 500 });
  }
}

export async function POST(req) {
  if (!validateAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  try {
    const news = await createNews(data);
    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Error creating news" }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!validateAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const newsId = Number(url.searchParams.get("news_id"));
  const data = await req.json();

  if (!newsId) {
    return NextResponse.json({ error: "news_id is required" }, { status: 400 });
  }

  try {
    const news = await updateNews(newsId, data);

    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json({ error: "Error updating news" }, { status: 500 });
  }
}
