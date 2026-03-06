import { PrismaClient } from '../prisma/generated';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { recordDbTiming } from '@/lib/utils/route-metrics';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// For Prisma v7 with PostgreSQL driver adapter
const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10, // Adjust pool size based on your needs
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })
    ),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const started = performance.now();
        try {
          return await query(args);
        } finally {
          recordDbTiming(performance.now() - started, model, operation);
        }
      },
    },
  },
}) as typeof prismaClient;
