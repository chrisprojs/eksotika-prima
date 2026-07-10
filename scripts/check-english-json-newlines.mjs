import prisma from "../src/lib/prisma.js";

const productRows = await prisma.product.findMany({
  select: { productId: true, title: true, merk: true, detail: true },
  orderBy: { productId: "asc" },
});
const newsRows = await prisma.news.findMany({
  select: { newsId: true, slug: true, title: true, summary: true, contentHtml: true },
  orderBy: { newsId: "asc" },
});

function getEnglish(value) {
  try {
    const json = JSON.parse(value);
    return typeof json?.en === "string" ? json.en : "";
  } catch {
    return "";
  }
}

function findBad(rows, idKey, fields) {
  return rows.flatMap((row) => fields
    .map((field) => ({ id: row[idKey], field, value: getEnglish(row[field]) }))
    .filter((item) => item.value.includes("\\n") || item.value.includes("\\r"))
    .map((item) => ({ id: item.id, field: item.field }))
  );
}

const badProducts = findBad(productRows, "productId", ["title", "merk", "detail"]);
const badNews = findBad(newsRows, "newsId", ["slug", "title", "summary", "contentHtml"]);

console.log(JSON.stringify({
  productsChecked: productRows.length,
  newsChecked: newsRows.length,
  badProducts,
  badNews,
}, null, 2));

await prisma.$disconnect();