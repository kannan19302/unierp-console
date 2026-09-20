import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useNotificationStore } from "@/lib/stores/notification-store";

describe("useNotificationStore (WS10)", () => {
  beforeEach(() => {
    act(() => {
      useNotificationStore.getState().clearAll();
    });
  });

  it("adds notifications and computes unread count", () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: "Backup Complete",
        message: "Tenant snapshot stored in S3.",
        severity: "info",
      });
    });

    expect(useNotificationStore.getState().notifications.length).toBe(1);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it("marks notification as read", () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: "Security Alert",
        message: "Anomalous login attempt detected.",
        severity: "warning",
      });
    });

    const notifId = useNotificationStore.getState().notifications[0].id;

    act(() => {
      useNotificationStore.getState().markAsRead(notifId);
    });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
  });

  it("marks all notifications as read", () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: "Alert 1",
        message: "First alert",
        severity: "info",
      });
      useNotificationStore.getState().addNotification({
        title: "Alert 2",
        message: "Second alert",
        severity: "error",
      });
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);

    act(() => {
      useNotificationStore.getState().markAllAsRead();
    });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
