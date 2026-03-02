import { useCallback, useEffect, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  type SpaceMessage,
} from "@/services/supabase/messages";

export function useMessages(spaceId: string | null, userId?: string, userName?: string) {
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
        // Replace optimistic message from the same user with real one
        const optimisticIdx = prev.findIndex(
          (m) =>
            m.id.startsWith("optimistic-") &&
            m.userId === newMessage.userId &&
            m.text === newMessage.text
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev];
          updated[optimisticIdx] = newMessage;
          return updated;
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

      // Optimistic message — shows instantly in the chat
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: SpaceMessage = {
        id: tempId,
        spaceId,
        userId,
        senderName: userName ?? "You",
        text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const result = await sendMessage(spaceId, userId, text);

      if (result.error) {
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(result.error);
        return { error: result.error };
      }

      // Replace the optimistic message with the real one
      if (result.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result.data! : m))
        );
      }

      return { error: null };
    },
    [spaceId, userId, userName]
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
