import { Prisma } from "@prisma/client";
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

function shouldIgnorePublicNewsFilter() {
  return process.env.IGNORE_PUBLIC_NEWS?.trim().toLowerCase() === "true";
}

function toUtcSqlDate(date = new Date()) {
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function getPublicNewsCondition(now = new Date()) {
  if (shouldIgnorePublicNewsFilter()) {
    return null;
  }

  return Prisma.sql`n."isPublished" = 1 AND datetime(n."createdAt") <= datetime(${toUtcSqlDate(now)})`;
}

function getWhereSql(conditions = []) {
  return conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
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

async function getNewsIds({ now = new Date(), category, productId, limit } = {}) {
  const publicCondition = getPublicNewsCondition(now);
  const conditions = publicCondition ? [publicCondition] : [];
  const productJoin = productId
    ? Prisma.sql`INNER JOIN "NewsProduct" np ON np."newsId" = n."newsId"`
    : Prisma.empty;
  const limitSql = limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;

  if (category) {
    conditions.push(Prisma.sql`n."category" = ${category}`);
  }

  if (productId) {
    conditions.push(Prisma.sql`np."productId" = ${Number(productId)}`);
  }

  const rows = await prisma.$queryRaw`
    SELECT n."newsId"
    FROM "News" n
    ${productJoin}
    ${getWhereSql(conditions)}
    ORDER BY datetime(n."createdAt") DESC
    ${limitSql}
  `;

  return rows.map((row) => row.newsId);
}

async function getNewsByIds(newsIds = []) {
  if (newsIds.length === 0) {
    return [];
  }

  const order = new Map(newsIds.map((newsId, index) => [newsId, index]));
  const newsList = await prisma.news.findMany({
    where: {
      newsId: { in: newsIds },
    },
    include: newsInclude,
  });

  return newsList.sort((a, b) => order.get(a.newsId) - order.get(b.newsId));
}

async function findNewsIdByLocalizedSlug(slug, locale, now) {
  const normalizedLocale = normalizeLocale(locale);
  const slugJsonPath = getSlugJsonPath(normalizedLocale);
  const allowPlainSlug = normalizedLocale === defaultLocale ? 1 : 0;
  const publicCondition = getPublicNewsCondition(now);
  const conditions = publicCondition ? [publicCondition] : [];

  conditions.push(Prisma.sql`(
    (${allowPlainSlug} = 1 AND n."slug" = ${slug})
    OR (json_valid(n."slug") AND json_extract(n."slug", ${slugJsonPath}) = ${slug})
  )`);

  const rows = await prisma.$queryRaw`
    SELECT n."newsId"
    FROM "News" n
    ${getWhereSql(conditions)}
    ORDER BY datetime(n."createdAt") DESC
    LIMIT 1
  `;

  return rows[0]?.newsId || null;
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
    const newsIds = await getNewsIds({ now });
    const newsList = await getNewsByIds(newsIds);

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
    const [educationNewsIds, crazyNewsIds] = await Promise.all([
      getNewsIds({ now, category: "Education", limit: 3 }),
      getNewsIds({ now, category: "Crazy News", limit: 3 }),
    ]);
    const [educationNews, crazyNews] = await Promise.all([
      getNewsByIds(educationNewsIds),
      getNewsByIds(crazyNewsIds),
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
    const newsIds = await getNewsIds({ now, productId, limit: 3 });
    const newsList = await getNewsByIds(newsIds);

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
    const publicCondition = getPublicNewsCondition(now);
    const rows = await prisma.$queryRaw`
      SELECT n."slug", n."createdAt", n."updatedAt"
      FROM "News" n
      ${getWhereSql(publicCondition ? [publicCondition] : [])}
      ORDER BY datetime(n."updatedAt") DESC
    `;

    return rows;
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