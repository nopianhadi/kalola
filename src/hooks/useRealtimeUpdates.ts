import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/app/AppContext';
import { getAuthToken } from '@/lib/apiClient';
import { projectKeys } from '@/features/projects/api/useProjects';
import { clientKeys } from '@/features/clients/api/useClients';
import { financeKeys } from '@/features/finance/api/useFinanceQueries';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

type SSEResource =
  | 'projects'
  | 'clients'
  | 'transactions'
  | 'cards'
  | 'pockets'
  | 'galleries'
  | 'team-members'
  | 'calendar-events'
  | 'notifications'
  | 'packages'
  | 'contracts'
  | 'team-payment-records'
  | 'team-project-payments'
  | 'add-ons'
  | 'promo-codes'
  | 'suggestions'
  | 'leads'
  | 'client-feedback'
  | 'profiles';

type SSEAction = 'created' | 'updated' | 'deleted';

interface SSEPayload {
  type?: 'connected';
  resource?: SSEResource;
  action?: SSEAction;
  data?: Record<string, unknown>;
  timestamp?: number;
  clientId?: string;
}

/**
 * useRealtimeUpdates — subscribes to the backend SSE stream and automatically
 * invalidates the relevant React Query caches when data changes.
 *
 * Mount this once at the app root (e.g., inside App.tsx or a layout component).
 */
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useApp();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000); // start at 1s, back off up to 30s

  useEffect(() => {
    // Only connect SSE when user is authenticated
    if (!isAuthenticated) return;

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      const token = getAuthToken();
      const es = new EventSource(`${API_BASE_URL}/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);
      esRef.current = es;

      es.onopen = () => {
        // Reset backoff on successful connection
        reconnectDelayRef.current = 1000;
        console.log('[SSE] Connected to real-time event stream.');
      };

      es.onmessage = (event) => {
        try {
          const payload: SSEPayload = JSON.parse(event.data);

          // Ignore the initial connection confirmation
          if (payload.type === 'connected') return;

          const { resource } = payload;
          if (!resource) return;

          handleInvalidation(resource, queryClient);
        } catch {
          // Malformed message — ignore
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        if (!isMounted) return;

        // Exponential backoff reconnect (max 30s)
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, 30000);
        console.warn(`[SSE] Connection lost. Reconnecting in ${delay}ms...`);

        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isMounted = false;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [queryClient, isAuthenticated]);
}

/**
 * Maps an SSE resource name to the React Query keys that should be invalidated.
 */
function handleInvalidation(resource: SSEResource, queryClient: ReturnType<typeof useQueryClient>) {
  switch (resource) {
    case 'projects':
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      break;

    case 'clients':
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      break;

    case 'transactions':
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions.all() });
      // Also refresh summary since totals change
      queryClient.invalidateQueries({ queryKey: [...financeKeys.all, 'summary'] });
      break;

    case 'cards':
      queryClient.invalidateQueries({ queryKey: financeKeys.cards.all() });
      queryClient.invalidateQueries({ queryKey: [...financeKeys.all, 'summary'] });
      break;

    case 'pockets':
      queryClient.invalidateQueries({ queryKey: financeKeys.pockets.all() });
      queryClient.invalidateQueries({ queryKey: [...financeKeys.all, 'summary'] });
      break;

    case 'galleries':
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      break;

    case 'team-members':
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      break;

    case 'calendar-events':
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      break;

    case 'notifications':
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      break;

    case 'packages':
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      break;

    case 'contracts':
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      break;

    case 'team-payment-records':
      queryClient.invalidateQueries({ queryKey: ['team-payment-records'] });
      break;

    case 'team-project-payments':
      queryClient.invalidateQueries({ queryKey: ['team-project-payments'] });
      break;

    case 'add-ons':
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      break;

    case 'promo-codes':
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      break;

    case 'suggestions':
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      break;

    case 'leads':
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      break;

    case 'client-feedback':
      queryClient.invalidateQueries({ queryKey: ['client-feedback'] });
      break;

    case 'profiles':
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      break;

    default:
      // Unknown resource — invalidate everything as a safe fallback
      queryClient.invalidateQueries();
      break;
  }
}
