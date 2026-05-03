import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient for the app — import from here so auth / axios can clear cache on session change.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
