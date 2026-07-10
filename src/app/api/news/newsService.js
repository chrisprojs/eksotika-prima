import prisma from "@/lib/prisma";
import {
  getNewsLocalizedJsonCreateData,
  getNewsLocalizedJsonUpdateData,
  localizeNews,
  localizeNewsList,
} from "@/lib/dbLocalization";
import { defaultLocale, normalizeLocale } from "@/lib/i18n";

const newsInclude = {
  products: {
    include: {
      product: {
        include: {
          variants: true,
        },
      },
    },
  },
};

const localizedNewsSelect = {
  slug: true,
  title: true,
  summary: true,
  contentHtml: true,
};

function isMissingNewsTable(error) {
  return String(error?.message || "").includes("no such table: main.News");
}

function isPublicNewsIgnored() {
  return process.env.IGNORE_PUBLIC_NEWS?.toLowerCase() === "true";
}

function resolveLocaleAndNow(localeOrNow = defaultLocale, maybeNow) {
  if (localeOrNow instanceof Date) {
    return { locale: defaultLocale, now: localeOrNow };
  }

  return {
    locale: normalizeLocale(localeOrNow),
    now: maybeNow || new Date(),
  };
}

function getNewsWriteData(data, { partial = false, currentRecord = {} } = {}) {
  const newsData = {};

  if (!partial || data.category !== undefined) {
    newsData.category = data.category || "Education";
  }

  if (!partial || data.coverImage !== undefined) {
    newsData.coverImage = data.coverImage || null;
  }

  if (!partial || data.isPublished !== undefined) {
    newsData.isPublished = data.isPublished ?? true;
  }

  return {
    ...newsData,
    ...(partial
      ? getNewsLocalizedJsonUpdateData(data, currentRecord)
      : getNewsLocalizedJsonCreateData(data)),
  };
}

function getSlugJsonPath(locale = defaultLocale) {
  return `$.${normalizeLocale(locale)}`;
}

async function findNewsIdByLocalizedSlug(slug, locale, now) {
  const normalizedLocale = normalizeLocale(locale);
  const slugJsonPath = getSlugJsonPath(normalizedLocale);
  const allowPlainSlug = normalizedLocale === defaultLocale;

  const rows = isPublicNewsIgnored()
    ? await prisma.$queryRaw`
        SELECT "newsId"
        FROM "News"
        WHERE (
          (${allowPlainSlug} = 1 AND "slug" = ${slug})
          OR (json_valid("slug") AND json_extract("slug", ${slugJsonPath}) = ${slug})
        )
        ORDER BY "createdAt" DESC
        LIMIT 1
      `
    : await prisma.$queryRaw`
        SELECT "newsId"
        FROM "News"
        WHERE "isPublished" = 1
          AND "createdAt" <= ${now}
          AND (
            (${allowPlainSlug} = 1 AND "slug" = ${slug})
            OR (json_valid("slug") AND json_extract("slug", ${slugJsonPath}) = ${slug})
          )
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

  return rows[0]?.newsId || null;
}

export function getPublicNewsWhere(now = new Date()) {
  if (isPublicNewsIgnored()) {
    return {};
  }

  return {
    isPublished: true,
    createdAt: {
      lte: now,
    },
  };
}

export function getProductLinks(productIds = []) {
  return productIds.map((productId) => ({
    product: {
      connect: { productId: Number(productId) },
    },
  }));
}

export async function getPublishedNewsList(
  localeOrNow = defaultLocale,
  maybeNow
) {
  const { locale, now } = resolveLocaleAndNow(localeOrNow, maybeNow);

  try {
    const newsList = await prisma.news.findMany({
      where: getPublicNewsWhere(now),
      orderBy: { createdAt: "desc" },
      include: newsInclude,
    });

    return localizeNewsList(newsList, locale);
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news list:", error);
    }
    return [];
  }
}

export async function getPublishedNewsBySlug(
  slug,
  localeOrNow = defaultLocale,
  maybeNow
) {
  const { locale, now } = resolveLocaleAndNow(localeOrNow, maybeNow);

  try {
    const newsId = await findNewsIdByLocalizedSlug(slug, locale, now);

    if (!newsId) {
      return null;
    }

    const news = await prisma.news.findUnique({
      where: { newsId },
      include: newsInclude,
    });

    return localizeNews(news, locale);
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news by slug:", error);
    }
    return null;
  }
}

export async function getNewsSectionByCategory(
  localeOrNow = defaultLocale,
  maybeNow
) {
  const { locale, now } = resolveLocaleAndNow(localeOrNow, maybeNow);

  try {
    const [educationNews, crazyNews] = await Promise.all([
      prisma.news.findMany({
        where: {
          ...getPublicNewsWhere(now),
          category: "Education",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: newsInclude,
      }),
      prisma.news.findMany({
        where: {
          ...getPublicNewsWhere(now),
          category: "Crazy News",
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: newsInclude,
      }),
    ]);

    return {
      educationNews: localizeNewsList(educationNews, locale),
      crazyNews: localizeNewsList(crazyNews, locale),
    };
  } catch (error) {
    if (!isMissingNewsTable(error)) {
      console.error("Failed to get news section:", error);
    }
    return { educationNews: [], crazyNews: [] };
  }
}

export async function getLatestNewsByProductId(
  productId,
  localeOrNow = defaultLocale,
  maybeNow
) {
  const { locale, now } = resolveLocaleAndNow(localeOrNow, maybeNow);

  try {
    const newsList = await prisma.news.findMany({
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
      include: newsInclude,
    });

    return localizeNewsList(newsList, locale);
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
      ...getNewsWriteData(data),
      products: {
        create: getProductLinks(data.productIds),
      },
    },
    include: newsInclude,
  });
}

export async function updateNews(newsId, data) {
  const currentNews = await prisma.news.findUnique({
    where: { newsId },
    select: localizedNewsSelect,
  });

  if (!currentNews) {
    return null;
  }

  return prisma.news.update({
    where: { newsId },
    data: {
      ...getNewsWriteData(data, {
        partial: true,
        currentRecord: currentNews,
      }),
      products: Array.isArray(data.productIds)
        ? {
            deleteMany: {},
            create: getProductLinks(data.productIds),
          }
        : undefined,
    },
    include: newsInclude,
  });
}