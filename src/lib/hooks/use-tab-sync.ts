"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface TabLockMessage {
  type: "LOCK" | "UNLOCK" | "QUERY_LOCK";
  entityType: string;
  entityId: string;
  tabId: string;
  operatorName?: string;
  timestamp: number;
}

export interface UseTabSyncOptions {
  entityType: string;
  entityId?: string | null;
  operatorName?: string;
  enabled?: boolean;
}

export interface UseTabSyncResult {
  isLockedByOtherTab: boolean;
  lockedBy: { operatorName?: string; tabId?: string } | null;
  acquireLock: () => void;
  releaseLock: () => void;
}

const CHANNEL_NAME = "unierp_tab_sync_channel";

export function useTabSync({
  entityType,
  entityId,
  operatorName = "Another operator",
  enabled = true,
}: UseTabSyncOptions): UseTabSyncResult {
  const [lockedBy, setLockedBy] = useState<{ operatorName?: string; tabId?: string } | null>(null);
  const tabIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isHoldingLock = useRef(false);

  // Initialize unique tab ID
  useEffect(() => {
    if (!tabIdRef.current) {
      tabIdRef.current = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }, []);

  const releaseLock = useCallback(() => {
    if (!enabled || !entityId || !channelRef.current || !isHoldingLock.current) return;
    try {
      const msg: TabLockMessage = {
        type: "UNLOCK",
        entityType,
        entityId,
        tabId: tabIdRef.current,
        timestamp: Date.now(),
      };
      channelRef.current.postMessage(msg);
      isHoldingLock.current = false;
    } catch {}
  }, [enabled, entityType, entityId]);

  const acquireLock = useCallback(() => {
    if (!enabled || !entityId || !channelRef.current) return;
    try {
      const msg: TabLockMessage = {
        type: "LOCK",
        entityType,
        entityId,
        tabId: tabIdRef.current,
        operatorName,
        timestamp: Date.now(),
      };
      channelRef.current.postMessage(msg);
      isHoldingLock.current = true;
    } catch {}
  }, [enabled, entityType, entityId, operatorName]);

  useEffect(() => {
    if (!enabled || !entityId || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent<TabLockMessage>) => {
      const data = event.data;
      if (!data || data.entityType !== entityType || data.entityId !== entityId) return;
      if (data.tabId === tabIdRef.current) return; // ignore our own messages

      if (data.type === "LOCK") {
        setLockedBy({
          operatorName: data.operatorName || "Another tab",
          tabId: data.tabId,
        });
      } else if (data.type === "UNLOCK") {
        setLockedBy((current) => {
          if (current?.tabId === data.tabId) {
            return null;
          }
          return current;
        });
      }
    };

    channel.addEventListener("message", handleMessage);

    // Release on unload
    const handleUnload = () => {
      if (isHoldingLock.current) {
        releaseLock();
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (isHoldingLock.current) {
        releaseLock();
      }
      channel.removeEventListener("message", handleMessage);
      channel.close();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [enabled, entityType, entityId, releaseLock]);

  return {
    isLockedByOtherTab: Boolean(lockedBy),
    lockedBy,
    acquireLock,
    releaseLock,
  };
}
