import { supabase } from "@/lib/supabaseClient";

export type NotificationType =
  | "SPACE_JOINED"
  | "QUORUM_REACHED"
  | "SPACE_STARTING"
  | "SPACE_CANCELLED"
  | "NEW_MESSAGE"
  | "NEARBY_SPACE";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  spaceId: string | null;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  userId: string;
  notifyFormation: boolean;
  notifyQuorum: boolean;
  notifyOnlyUndavened: boolean;
  kaddishPriority: boolean;
};

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[fetchNotifications] Error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    spaceId: row.space_id,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("[fetchUnreadCount] Error:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("[markAsRead] Error:", error.message);
    return false;
  }

  return true;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("[markAllAsRead] Error:", error.message);
    return false;
  }

  return true;
}

export async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[fetchNotificationPreferences] Error:", error.message);
    return null;
  }

  return {
    userId: data.user_id,
    notifyFormation: data.notify_formation,
    notifyQuorum: data.notify_quorum,
    notifyOnlyUndavened: data.notify_only_undavened,
    kaddishPriority: data.kaddish_priority,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "userId">>
): Promise<boolean> {
  if (!supabase) return false;

  const updatePayload: Record<string, boolean> = {};
  if (preferences.notifyFormation !== undefined) {
    updatePayload.notify_formation = preferences.notifyFormation;
  }
  if (preferences.notifyQuorum !== undefined) {
    updatePayload.notify_quorum = preferences.notifyQuorum;
  }
  if (preferences.notifyOnlyUndavened !== undefined) {
    updatePayload.notify_only_undavened = preferences.notifyOnlyUndavened;
  }
  if (preferences.kaddishPriority !== undefined) {
    updatePayload.kaddish_priority = preferences.kaddishPriority;
  }

  const { error } = await supabase
    .from("notification_preferences")
    .update(updatePayload)
    .eq("user_id", userId);

  if (error) {
    console.error("[updateNotificationPreferences] Error:", error.message);
    return false;
  }

  return true;
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newNotification = payload.new as {
          id: string;
          user_id: string;
          type: string;
          space_id: string | null;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };

        onNotification({
          id: newNotification.id,
          userId: newNotification.user_id,
          type: newNotification.type as NotificationType,
          spaceId: newNotification.space_id,
          title: newNotification.title,
          body: newNotification.body,
          read: newNotification.read,
          createdAt: newNotification.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}
