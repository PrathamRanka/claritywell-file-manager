import { useEffect, useRef } from 'react';
import useSWR from 'swr';

interface UseRealtimeSyncOptions {
  refreshInterval?: number; // Polling interval in ms (default: 5000)
  dedupingInterval?: number; // Deduping interval (default: 2000)
  focusThrottleInterval?: number; // Throttle re-fetch on focus (default: 5000)
  revalidateOnFocus?: boolean; // Re-fetch when window regains focus (default: true)
  revalidateOnReconnect?: boolean; // Re-fetch when connection restored (default: true)
  revalidateIfStale?: boolean; // Re-fetch if data is stale (default: true)
  shouldRetryOnError?: boolean; // Retry on error (default: true)
  maxRetries?: number; // Max retry attempts (default: 3)
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Enhanced real-time synchronization hook using SWR with optimized polling
 * Provides automatic re-fetching on focus, connection restore, and errors
 */
export function useRealtimeSync<T>(
  url: string | null,
  options: UseRealtimeSyncOptions = {}
) {
  const {
    refreshInterval = 5000,
    dedupingInterval = 2000,
    focusThrottleInterval = 5000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    revalidateIfStale = true,
    shouldRetryOnError = true,
    maxRetries = 3,
  } = options;

  const retryCountRef = useRef(0);

  const { data, error, mutate, isLoading } = useSWR<T>(url, fetcher, {
    // Polling configuration
    refreshInterval,
    dedupingInterval,

    // Focus management
    revalidateOnFocus,
    focusThrottleInterval,

    // Connection management
    revalidateOnReconnect,

    // Error handling
    revalidateIfStale,
    shouldRetryOnError,
    errorRetryCount: maxRetries,
    errorRetryInterval: 1000,

    // Optimization
    cache: true,
    compare: (a, b) => {
      // Simple equality check for SWR cache
      return JSON.stringify(a) === JSON.stringify(b);
    },
  });

  // Handle connection state changes
  useEffect(() => {
    if (!url) return;

    const handleOnline = () => {
      retryCountRef.current = 0;
      mutate();
    };

    const handleOffline = () => {
      console.warn('Connection lost...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [url, mutate]);

  // Reset retry count on successful fetch
  useEffect(() => {
    if (!error) {
      retryCountRef.current = 0;
    }
  }, [error]);

  return {
    data: data as T | undefined,
    isLoading,
    error,
    mutate,
    isValidating: isLoading,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

/**
 * Hook for polling a list of items with automatic sync
 */
export function useRealtimeSyncList<T extends { id: string }>(
  url: string | null,
  options: UseRealtimeSyncOptions = {}
) {
  const { data, isLoading, error, mutate } = useRealtimeSync<{ data: T[] }>(url, options);

  const list = data?.data || [];

  return {
    list,
    isLoading,
    error,
    mutate,
    refresh: () => mutate(),
  };
}

/**
 * Hook for real-time sync with manual refetch capability
 * Useful for when you need more control over when to fetch
 */
export function useRealtimeSyncManual<T>(
  url: string | null,
  options: UseRealtimeSyncOptions = { refreshInterval: 0 } // Disable auto-polling by default
) {
  const { data, isLoading, error, mutate } = useRealtimeSync<T>(url, options);

  return {
    data: data as T | undefined,
    isLoading,
    error,
    refetch: () => mutate(),
  };
}
