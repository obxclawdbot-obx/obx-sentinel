// @ts-nocheck
import { PrismaClient } from "@/generated/prisma";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: any };

function createClient() {
  const dbPath = path.join(process.cwd(), "dev.db");
  const sqlite = new Database(dbPath);
  const adapter = new PrismaBetterSqlite3(sqlite);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
