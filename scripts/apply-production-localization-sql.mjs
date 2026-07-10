import fs from "node:fs";
import { createClient } from "@libsql/client";

const envPath = ".env.production";
const sqlPath = "prisma/scripts/production_localization_bulk_update.sql";

function loadEnvFile(path) {
  const env = {};
  const text = fs.readFileSync(path, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

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

const env = loadEnvFile(envPath);
const url = env.DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  throw new Error(`${envPath} DATABASE_URL must be a production libsql:// URL.`);
}

if (!authToken) {
  throw new Error(`${envPath} TURSO_AUTH_TOKEN is required.`);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const statements = splitSqlStatements(sql);
const client = createClient({ url, authToken });

try {
  for (const statement of statements) {
    await client.execute(statement);
  }

  console.log(JSON.stringify({
    applied: true,
    statements: statements.length,
    database: url.replace(/^libsql:\/\//, "libsql://***@"),
  }, null, 2));
} finally {
  client.close?.();
}