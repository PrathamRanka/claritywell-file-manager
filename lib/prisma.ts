import { PrismaClient } from '../prisma/generated';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = `${process.env.DATABASE_URL}`;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      pool: new pg.Pool({ connectionString }),
    }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
