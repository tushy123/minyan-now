import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  subscribeToNotifications,
  type Notification,
  type NotificationPreferences,
} from "@/services/supabase/notifications";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      return;
    }

    setLoading(true);

    Promise.all([
      fetchNotifications(userId),
      fetchUnreadCount(userId),
      fetchNotificationPreferences(userId),
    ])
      .then(([notifs, count, prefs]) => {
        setNotifications(notifs);
        setUnreadCount(count);
        setPreferences(prefs);
      })
      .catch((err) => {
        console.error("[useNotifications] Fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.body ?? undefined,
          icon: "/icon-192.png",
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const markRead = useCallback(async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return false;
    const success = await markAllAsRead(userId);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
    return success;
  }, [userId]);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<NotificationPreferences, "userId">>) => {
      if (!userId) return false;
      const success = await updateNotificationPreferences(userId, updates);
      if (success && preferences) {
        setPreferences({ ...preferences, ...updates });
      }
      return success;
    },
    [userId, preferences]
  );

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    markRead,
    markAllRead,
    updatePreferences,
    requestPermission,
  };
}
