import { useCallback, useEffect, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  type SpaceMessage,
} from "@/services/supabase/messages";

export function useMessages(spaceId: string | null, userId?: string) {
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!spaceId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetchMessages(spaceId)
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => {
        console.error("[useMessages] Fetch error:", err);
        setError("Failed to load messages");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [spaceId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!spaceId) return;

    const unsubscribe = subscribeToMessages(spaceId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [spaceId]);

  const send = useCallback(
    async (text: string) => {
      if (!spaceId || !userId) {
        return { error: "Please sign in to send messages." };
      }

      setError(null);
      const result = await sendMessage(spaceId, userId, text);

      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }

      // Add message optimistically (real-time will also add it, but we dedupe)
      if (result.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.data!.id)) {
            return prev;
          }
          return [...prev, result.data!];
        });
      }

      return { error: null };
    },
    [spaceId, userId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    send,
    clearMessages,
  };
}
