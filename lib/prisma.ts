import { PrismaClient } from '../prisma/generated';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { recordDbTiming } from '@/lib/utils/route-metrics';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ] as any
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  (prismaClient as any).$on('query', (e: any) => {
    // Logging disabled
  });
}

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
