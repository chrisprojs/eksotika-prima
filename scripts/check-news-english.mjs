import prisma from "../src/lib/prisma.js";

const rows = await prisma.news.findMany({
  select: { newsId: true, slug: true, title: true, summary: true, contentHtml: true },
  orderBy: { newsId: "asc" },
});

function json(value) {
  try { return JSON.parse(value); } catch { return {}; }
}

const report = rows.map((row) => {
  const slug = json(row.slug);
  const title = json(row.title);
  const summary = json(row.summary);
  const content = json(row.contentHtml);
  const fields = { slug: slug.en, title: title.en, summary: summary.en, contentHtml: content.en };
  const badFields = Object.entries(fields)
    .filter(([, value]) => typeof value === "string" && /â|Ã|�|\.\.\.<\/p>|\.\.\.$/.test(value))
    .map(([field]) => field);

  return {
    newsId: row.newsId,
    idSlug: slug.id,
    enSlug: slug.en,
    enTitleLength: title.en?.length || 0,
    enSummaryLength: summary.en?.length || 0,
    enContentLength: content.en?.length || 0,
    badFields,
    enContentPreview: String(content.en || "").slice(0, 140),
  };
});

console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();