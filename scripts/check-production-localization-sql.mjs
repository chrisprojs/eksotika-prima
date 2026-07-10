import fs from "node:fs";

const sqlPath = "prisma/scripts/production_localization_bulk_update.sql";

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let inSingleQuote = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const nextChar = sql[index + 1];

    if (char === "'" && inSingleQuote && nextChar === "'") {
      current += "''";
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const statement = current.trim();
  if (statement) statements.push(statement);

  return statements
    .map((item) => item.split(/\r?\n/).filter((line) => !line.trimStart().startsWith("--")).join("\n").trim())
    .filter(Boolean);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const statements = splitSqlStatements(sql);
const productUpdates = statements.filter((statement) => statement.startsWith('UPDATE "Product"')).length;
const newsUpdates = statements.filter((statement) => statement.startsWith('UPDATE "News"')).length;

console.log(JSON.stringify({
  statements: statements.length,
  productUpdates,
  newsUpdates,
  hasBegin: statements.some((statement) => statement === "BEGIN TRANSACTION"),
  hasCommit: statements.some((statement) => statement === "COMMIT"),
}, null, 2));