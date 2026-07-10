import { getNewsSectionByCategory } from "@/app/api/news/newsService";
import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "id";

  try {
    const newsSections = await getNewsSectionByCategory(locale);
    return NextResponse.json(newsSections);
  } catch (error) {
    console.error("Error getting news sections:", error);
    return NextResponse.json({ educationNews: [], crazyNews: [] }, { status: 500 });
  }
}
