import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return databaseUrl;
}

function createPrismaClient() {
  const url = getDatabaseUrl();
  const clientOptions = url.startsWith("file:")
    ? { url }
    : { url, authToken: process.env.TURSO_AUTH_TOKEN };

  const libsql = createClient(clientOptions);
  const adapter = new PrismaLibSQL(libsql);

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;