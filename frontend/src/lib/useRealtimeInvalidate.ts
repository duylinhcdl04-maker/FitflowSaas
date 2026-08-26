import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { getSocket } from './socket';

/**
 * Subscribes to a realtime event and invalidates the given TanStack Query keys
 * whenever it fires. This is what lets a second open tab / Manager dashboard
 * update live when a Staff screen elsewhere confirms a payment or checks
 * someone in, instead of waiting on the slow `refetchInterval` safety net.
 */
export function useRealtimeInvalidate(event: string, queryKeys: QueryKey[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, JSON.stringify(queryKeys)]);
}

/**
 * Subscribes to a realtime event and invokes a callback with its payload —
 * used for the VietQR "payment:confirmed" flow, which needs the paymentId to
 * decide whether to close its own modal, not just a blanket cache invalidation.
 */
export function useRealtimeEvent<T = any>(event: string, onEvent: (payload: T) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, onEvent);
    return () => {
      socket.off(event, onEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
