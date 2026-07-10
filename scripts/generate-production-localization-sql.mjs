import fs from "node:fs";
import path from "node:path";
import prisma from "../src/lib/prisma.js";

const outputPath = path.resolve("prisma/scripts/production_localization_bulk_update.sql");

function parseJsonObject(value) {
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function normalizeJsonText(value) {
  const parsed = parseJsonObject(value);
  return JSON.stringify(parsed || { id: value || "" });
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function getLocaleValue(value, locale) {
  const parsed = parseJsonObject(value);
  return typeof parsed?.[locale] === "string" ? parsed[locale] : "";
}

function productUpdateSql(product) {
  const idTitle = getLocaleValue(product.title, "id");

  return `UPDATE "Product"
SET
    "title" = ${sqlString(normalizeJsonText(product.title))},
    "merk" = ${sqlString(normalizeJsonText(product.merk))},
    "detail" = ${sqlString(normalizeJsonText(product.detail))}
WHERE "productId" = ${product.productId}
   OR "title" = ${sqlString(idTitle)}
   OR (json_valid("title") AND json_extract("title", '$.id') = ${sqlString(idTitle)});`;
}

function newsUpdateSql(news) {
  const idSlug = getLocaleValue(news.slug, "id");
  const enSlug = getLocaleValue(news.slug, "en");

  return `UPDATE "News"
SET
    "slug" = ${sqlString(normalizeJsonText(news.slug))},
    "title" = ${sqlString(normalizeJsonText(news.title))},
    "summary" = ${sqlString(normalizeJsonText(news.summary))},
    "contentHtml" = ${sqlString(normalizeJsonText(news.contentHtml))}
WHERE "newsId" = ${news.newsId}
   OR "slug" = ${sqlString(idSlug)}
   OR "slug" = ${sqlString(enSlug)}
   OR (json_valid("slug") AND json_extract("slug", '$.id') = ${sqlString(idSlug)})
   OR (json_valid("slug") AND json_extract("slug", '$.en') = ${sqlString(enSlug)});`;
}

const [products, newsList] = await Promise.all([
  prisma.product.findMany({
    select: {
      productId: true,
      title: true,
      merk: true,
      detail: true,
    },
    orderBy: { productId: "asc" },
  }),
  prisma.news.findMany({
    select: {
      newsId: true,
      slug: true,
      title: true,
      summary: true,
      contentHtml: true,
    },
    orderBy: { newsId: "asc" },
  }),
]);

const sql = [
  "-- Production localization bulk update",
  "-- Generated from local prisma/dev.db.",
  "-- Product localized JSON fields: title, merk, detail.",
  "-- News localized JSON fields: slug, title, summary, contentHtml.",
  "-- Product.produsen is not localized and is not changed.",
  "-- Run this on Turso production after the database localization migration.",
  "",
  "BEGIN TRANSACTION;",
  "",
  "-- Products",
  ...products.map(productUpdateSql),
  "",
  "-- News",
  ...newsList.map(newsUpdateSql),
  "",
  "COMMIT;",
  "",
].join("\n\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql, "utf8");

console.log(JSON.stringify({
  outputPath,
  products: products.length,
  news: newsList.length,
}, null, 2));

await prisma.$disconnect();