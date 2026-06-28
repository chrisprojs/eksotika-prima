import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function validateAdminKey(req) {
  const adminKey = req.headers.get("admin-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY);
}

function getNewsData(data) {
  return {
    slug: data.slug,
    title: data.title,
    category: data.category || "Education",
    summary: data.summary,
    contentHtml: data.contentHtml,
    coverImage: data.coverImage || null,
    isPublished: data.isPublished ?? true,
  };
}

function getProductLinks(productIds = []) {
  return productIds.map((productId) => ({
    product: {
      connect: { productId: Number(productId) },
    },
  }));
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  try {
    if (slug) {
      const news = await prisma.news.findUnique({
        where: { slug },
        include: {
          products: {
            include: {
              product: {
                include: { variants: true },
              },
            },
          },
        },
      });

      if (!news) {
        return NextResponse.json({ error: "News not found" }, { status: 404 });
      }

      return NextResponse.json(news);
    }

    const newsList = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: {
          include: {
            product: {
              include: { variants: true },
            },
          },
        },
      },
    });

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
    const news = await prisma.news.create({
      data: {
        ...getNewsData(data),
        products: {
          create: getProductLinks(data.productIds),
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

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
    const news = await prisma.news.update({
      where: { newsId },
      data: {
        ...getNewsData(data),
        products: Array.isArray(data.productIds)
          ? {
              deleteMany: {},
              create: getProductLinks(data.productIds),
            }
          : undefined,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json({ error: "Error updating news" }, { status: 500 });
  }
}

