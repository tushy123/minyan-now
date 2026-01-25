import { supabase } from "@/lib/supabaseClient";
import { sendMessageSchema, validateInput, sanitizeText } from "@/lib/validations";

export type SpaceMessage = {
  id: string;
  spaceId: string;
  userId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type MessageResult =
  | { data: SpaceMessage; error: null }
  | { data: null; error: string };

export async function fetchMessages(spaceId: string): Promise<SpaceMessage[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("space_messages")
    .select("id, space_id, user_id, text, created_at, sender:profiles(full_name)")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchMessages] Error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    return {
      id: row.id as string,
      spaceId: row.space_id as string,
      userId: row.user_id as string,
      senderName: (sender as { full_name: string | null } | null)?.full_name ?? "Anonymous",
      text: row.text as string,
      createdAt: row.created_at as string,
    };
  });
}

export async function sendMessage(
  spaceId: string,
  userId: string,
  text: string
): Promise<MessageResult> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  // Validate input
  const validation = validateInput(sendMessageSchema, { spaceId, userId, text });
  if (!validation.success) {
    return { data: null, error: validation.error };
  }

  // Sanitize text to prevent XSS
  const sanitizedText = sanitizeText(validation.data.text);

  const { data, error } = await supabase
    .from("space_messages")
    .insert({
      space_id: spaceId,
      user_id: userId,
      text: sanitizedText,
    })
    .select("id, space_id, user_id, text, created_at")
    .single();

  if (error) {
    console.error("[sendMessage] Error:", error.message);
    return { data: null, error: error.message };
  }

  // Fetch sender name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  return {
    data: {
      id: data.id,
      spaceId: data.space_id,
      userId: data.user_id,
      senderName: profile?.full_name ?? "Anonymous",
      text: data.text,
      createdAt: data.created_at,
    },
    error: null,
  };
}

export function subscribeToMessages(
  spaceId: string,
  onMessage: (message: SpaceMessage) => void
): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`space-messages-${spaceId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "space_messages",
        filter: `space_id=eq.${spaceId}`,
      },
      async (payload) => {
        if (!supabase) return;

        const newMessage = payload.new as {
          id: string;
          space_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };

        // Fetch sender name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", newMessage.user_id)
          .single();

        onMessage({
          id: newMessage.id,
          spaceId: newMessage.space_id,
          userId: newMessage.user_id,
          senderName: profile?.full_name ?? "Anonymous",
          text: newMessage.text,
          createdAt: newMessage.created_at,
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
