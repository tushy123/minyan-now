import type { Profile } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export async function upsertProfile(user: Session["user"], displayName?: string) {
  if (!supabase) return;
  const fallbackName = user.email ? user.email.split("@")[0] : "Member";
  const fullName =
    displayName ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    fallbackName;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
    },
    { onConflict: "id" },
  );
}

export async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, reliability, streak")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}
