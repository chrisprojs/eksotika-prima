import { getNewsSectionByCategory } from "@/app/api/news/newsService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const newsSections = await getNewsSectionByCategory();
    return NextResponse.json(newsSections);
  } catch (error) {
    console.error("Error getting news sections:", error);
    return NextResponse.json({ educationNews: [], crazyNews: [] }, { status: 500 });
  }
}
