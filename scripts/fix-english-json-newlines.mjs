import fs from "node:fs";
import prisma from "../src/lib/prisma.js";

const sql = fs
  .readFileSync("./prisma/scripts/fix_english_json_newlines.sql", "utf8")
  .split(/\r?\n/)
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
const statements = sql
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

const product = await prisma.product.findUnique({
  where: { productId: 39 },
  select: { detail: true },
});
const englishDetail = JSON.parse(product.detail).en || "";

console.log(JSON.stringify({
  statementsRun: statements.length,
  fixedProduct39: Boolean(englishDetail),
  hasRealNewline: englishDetail.includes("\n"),
  hasLiteralBackslashN: englishDetail.includes("\\n"),
  hasLiteralBackslashR: englishDetail.includes("\\r"),
  preview: englishDetail.slice(0, 140),
}, null, 2));

await prisma.$disconnect();