import prisma from "@/lib/prisma";

const productInclude = {
  include: {
    product: {
      include: {
        variants: true,
      },
    },
  },
};

function isMissingNewsTable(error) {
  return String(error?.message || "").includes("no such table: main.News");
}

export async function getPublishedNewsList() {
  try {
    return await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: {
        products: productInclude,
      },
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news list:", error);
    }
    return [];
  }
}

export async function getPublishedNewsBySlug(slug) {
  try {
    return await prisma.news.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        products: productInclude,
      },
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news by slug:", error);
    }
    return null;
  }
}
export async function getNewsSectionByCategory() {
  try {
    const [educationNews, crazyNews] = await Promise.all([
      prisma.news.findMany({
        where: {
          isPublished: true,
          category: "Education",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          products: productInclude,
        },
      }),
      prisma.news.findMany({
        where: {
          isPublished: true,
          category: "Crazy News",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          products: productInclude,
        },
      }),
    ]);

    return { educationNews, crazyNews };
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news section:", error);
    }
    return { educationNews: [], crazyNews: [] };
  }
}
export async function getLatestNewsByProductId(productId) {
  try {
    return await prisma.news.findMany({
      where: {
        isPublished: true,
        products: {
          some: {
            productId: Number(productId),
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        products: productInclude,
      },
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get product news:", error);
    }
    return [];
  }
}