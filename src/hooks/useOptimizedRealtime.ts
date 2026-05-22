import { useCallback } from 'react';

export function useOptimizedRealtime(
  _config: any,
  _onUpdate: (payload: any) => void,
  _options: any = {}
) {
  // Realtime disabled for local backend migration
  
  const disconnect = useCallback(() => {}, []);
  const reconnect = useCallback(() => {}, []);

  return {
    isConnected: false,
    reconnectAttempts: 0,
    disconnect,
    reconnect
  };
}
