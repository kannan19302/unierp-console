"use client";

import { useEffect } from "react";
import { useConsoleSocket } from "./use-console-socket";

/**
 * Hook to automatically reload data when specific real-time events are received over WebSockets.
 * 
 * @param events Array of event names to listen to (e.g. ['tenant.create', 'tenant.update'])
 * @param reload The function to call when an event triggers (typically from useList or useItem)
 */
export function useRealtimeData(events: string[], reload: () => void) {
  const { socket, isConnected } = useConsoleSocket();

  useEffect(() => {
    if (!socket || !isConnected || events.length === 0) return;

    // Attach listeners for all specified events
    events.forEach(eventName => {
      socket.on(eventName, () => {
        // Debounce or directly call reload
        reload();
      });
    });

    // Cleanup listeners on unmount or socket change
    return () => {
      events.forEach(eventName => {
        socket.off(eventName);
      });
    };
  }, [socket, isConnected, events.join(","), reload]);
}
