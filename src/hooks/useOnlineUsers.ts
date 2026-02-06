import { useEffect, useState, useCallback } from "react";
import { getOnlineUserCount, updateUserPresence, setUserOffline } from "@/services/supabase/friends";

export function useOnlineUsers(userId: string | undefined) {
  const [onlineCount, setOnlineCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const count = await getOnlineUserCount();
    setOnlineCount(count);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [fetchCount]);

  // Update user's own presence when logged in
  useEffect(() => {
    if (!userId) return;

    // Mark as online
    updateUserPresence();

    // Update presence every minute
    const presenceInterval = setInterval(() => {
      updateUserPresence();
    }, 60000);

    // Mark as offline when leaving
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setUserOffline();
      } else {
        updateUserPresence();
      }
    };

    const handleBeforeUnload = () => {
      setUserOffline();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setUserOffline();
    };
  }, [userId]);

  return { onlineCount };
}
