import { AsyncLocalStorage } from 'node:async_hooks';
import { NextResponse } from 'next/server';

type SlowQuery = {
  model?: string;
  operation?: string;
  durationMs: number;
};

export type RouteMetrics = {
  route: string;
  method: string;
  status: number;
  totalMs: number;
  authMs: number;
  dbMs: number;
  dbQueryCount: number;
  serializationMs: number;
  slowQueries: SlowQuery[];
  requestCache: Map<string, unknown>;
  startedAt: string;
  error?: string;
};

const metricsStore = new AsyncLocalStorage<RouteMetrics>();

function getStore() {
  return metricsStore.getStore();
}

export function recordAuthTiming(ms: number) {
  const metrics = getStore();
  if (!metrics) return;
  metrics.authMs += ms;
}

export function recordDbTiming(ms: number, model?: string, operation?: string) {
  const metrics = getStore();
  if (!metrics) return;
  metrics.dbMs += ms;
  metrics.dbQueryCount += 1;

  if (ms >= 250) {
    metrics.slowQueries.push({ durationMs: ms, model, operation });
  }
}

export function recordSerializationTiming(ms: number) {
  const metrics = getStore();
  if (!metrics) return;
  metrics.serializationMs += ms;
}

export function getRequestCache() {
  const metrics = getStore();
  return metrics?.requestCache;
}

export function timedJson<T>(body: T, init?: ResponseInit) {
  const start = performance.now();
  const response = NextResponse.json(body, init);
  recordSerializationTiming(performance.now() - start);
  return response;
}

function logMetrics(metrics: RouteMetrics) {
  const base = {
    route: metrics.route,
    method: metrics.method,
    status: metrics.status,
    totalMs: Number(metrics.totalMs.toFixed(2)),
    authMs: Number(metrics.authMs.toFixed(2)),
    dbMs: Number(metrics.dbMs.toFixed(2)),
    dbQueryCount: metrics.dbQueryCount,
    serializationMs: Number(metrics.serializationMs.toFixed(2)),
    startedAt: metrics.startedAt,
    error: metrics.error,
  };

  if (metrics.totalMs >= 1000) {
    console.warn('[SLOW_API_ROUTE]', {
      ...base,
      slowQueries: metrics.slowQueries,
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[API_ROUTE_METRICS]', base);
  }
}

export function withRouteMetrics<TArgs extends unknown[], TResult>(
  route: string,
  method: string,
  handler: (...args: TArgs) => Promise<TResult> | TResult
) {
  return async (...args: TArgs): Promise<TResult> => {
    const metrics: RouteMetrics = {
      route,
      method,
      status: 500,
      totalMs: 0,
      authMs: 0,
      dbMs: 0,
      dbQueryCount: 0,
      serializationMs: 0,
      slowQueries: [],
      requestCache: new Map<string, unknown>(),
      startedAt: new Date().toISOString(),
    };

    return metricsStore.run(metrics, async () => {
      const started = performance.now();

      try {
        const result = await handler(...args);

        if (result && typeof result === 'object') {
          const maybeStatus = (result as Record<string, unknown>).status;
          if (typeof maybeStatus === 'number') {
            metrics.status = maybeStatus;
          }
        }

        return result;
      } catch (error) {
        metrics.error = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        metrics.totalMs = performance.now() - started;
        logMetrics(metrics);
      }
    });
  };
}
