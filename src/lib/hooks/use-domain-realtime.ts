"use client";

import { useEffect, useState, useRef } from "react";
import { useConsoleSocket } from "./use-console-socket";

export interface DomainRealtimeResult {
  status: "connected" | "disconnected" | "connecting";
  lastEventTime: Date | null;
  lastPayload: any;
}

export function useDomainRealtime(
  domain: string,
  onEvent?: (eventName: string, payload: any) => void
): DomainRealtimeResult {
  const { socket, isConnected } = useConsoleSocket();
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Standard event topics for the domain + universal cross-domain events
    const events = [
      `${domain}.created`,
      `${domain}.updated`,
      `${domain}.deleted`,
      `${domain}.status_changed`,
      `${domain}.changed`,
      `${domain}:mutation`,
      "domain.update",
      "tenant:update",
    ];

    const handleEvent = (eventName: string) => (payload: any) => {
      // Filter domain.update if scoped to a specific other domain
      if (eventName === "domain.update" && payload?.domain && payload.domain !== domain) {
        return;
      }
      const now = new Date();
      setLastEventTime(now);
      setLastPayload(payload);
      if (onEventRef.current) {
        onEventRef.current(eventName, payload);
      }
    };

    const listeners: Array<{ event: string; fn: (payload: any) => void }> = [];

    events.forEach((evt) => {
      const listener = handleEvent(evt);
      socket.on(evt, listener);
      listeners.push({ event: evt, fn: listener });
    });

    return () => {
      listeners.forEach(({ event, fn }) => {
        socket.off(event, fn);
      });
    };
  }, [socket, isConnected, domain]);

  const status = isConnected ? "connected" : socket ? "connecting" : "disconnected";

  return {
    status,
    lastEventTime,
    lastPayload,
  };
}
