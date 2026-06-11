import { QueryClient } from '@tanstack/react-query';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  if (msg.includes('401') || msg.includes('sesi berakhir') || msg.includes('token')) return false;
  if (msg.includes('tidak dapat terhubung') || msg.includes('tidak merespons')) return false;
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: shouldRetryQuery,
    },
  },
});
