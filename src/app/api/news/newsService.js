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

const publicNewsInclude = {
  products: productInclude,
};

function isMissingNewsTable(error) {
  return String(error?.message || "").includes("no such table: main.News");
}

export function getPublicNewsWhere(now = new Date()) {
  if (process.env.IGNORE_PUBLIC_NEWS?.toLowerCase() === "true") {
    return {};
  }

  return {
    isPublished: true,
    createdAt: {
      lte: now,
    },
  };
}

export function getNewsData(data) {
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

export function getProductLinks(productIds = []) {
  return productIds.map((productId) => ({
    product: {
      connect: { productId: Number(productId) },
    },
  }));
}

export async function getPublishedNewsList(now = new Date()) {
  try {
    return await prisma.news.findMany({
      where: getPublicNewsWhere(now),
      orderBy: { createdAt: "desc" },
      include: publicNewsInclude,
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news list:", error);
    }
    return [];
  }
}

export async function getPublishedNewsBySlug(slug, now = new Date()) {
  try {
    return await prisma.news.findFirst({
      where: {
        ...getPublicNewsWhere(now),
        slug,
      },
      include: publicNewsInclude,
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news by slug:", error);
    }
    return null;
  }
}

export async function getNewsSectionByCategory(now = new Date()) {
  try {
    const [educationNews, crazyNews] = await Promise.all([
      prisma.news.findMany({
        where: {
          ...getPublicNewsWhere(now),
          category: "Education",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: publicNewsInclude,
      }),
      prisma.news.findMany({
        where: {
          ...getPublicNewsWhere(now),
          category: "Crazy News",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: publicNewsInclude,
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

export async function getLatestNewsByProductId(productId, now = new Date()) {
  try {
    return await prisma.news.findMany({
      where: {
        ...getPublicNewsWhere(now),
        products: {
          some: {
            productId: Number(productId),
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: publicNewsInclude,
    });
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get product news:", error);
    }
    return [];
  }
}

export async function getSitemapNewsList(now = new Date()) {
  try {
    return await prisma.news.findMany({
      where: getPublicNewsWhere(now),
      select: {
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to build news sitemap:", error);
    return [];
  }
}

export async function createNews(data) {
  return prisma.news.create({
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
}

export async function updateNews(newsId, data) {
  return prisma.news.update({
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
}


