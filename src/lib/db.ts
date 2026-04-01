// @ts-nocheck
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | null };

function createClient(): PrismaClient {
  const { Pool } = require("@neondatabase/serverless");
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Lazy singleton - only creates client on first access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = createClient();
    }
    return (globalForPrisma._prisma as any)[prop];
  },
});
