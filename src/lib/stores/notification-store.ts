import { create } from "zustand";

export interface ConsoleNotification {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  timestamp: number;
  read: boolean;
}

export interface NotificationState {
  notifications: ConsoleNotification[];
  unreadCount: number;

  addNotification: (notification: Omit<ConsoleNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [
    {
      id: "n-1",
      title: "System Online",
      message: "All 22 Provider Control Centers operating normally.",
      severity: "success",
      timestamp: Date.now() - 3600000,
      read: true,
    },
  ],
  unreadCount: 0,

  addNotification: (notif) =>
    set((state) => {
      const newNotif: ConsoleNotification = {
        ...notif,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        read: false,
      };
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
