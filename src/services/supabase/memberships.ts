import { supabase } from "@/lib/supabaseClient";
import { joinSpaceSchema, leaveSpaceSchema, validateInput } from "@/lib/validations";

export type MembershipResult =
  | { error: null; code: null; duplicate?: false }
  | { error: string; code: string | null; duplicate?: boolean };

export async function fetchMemberships(userId: string): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[fetchMemberships] Error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.space_id as string);
}

export async function fetchSpaceMembers(spaceId: string): Promise<{
  userId: string;
  fullName: string | null;
  joinedAt: string;
}[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("space_members")
    .select("user_id, joined_at, profile:profiles(full_name)")
    .eq("space_id", spaceId);

  if (error) {
    console.error("[fetchSpaceMembers] Error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    // Supabase returns array for single foreign key joins
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      userId: row.user_id as string,
      fullName: (profile as { full_name: string | null } | null)?.full_name ?? null,
      joinedAt: row.joined_at as string,
    };
  });
}

export async function joinSpace(
  spaceId: string,
  userId: string
): Promise<MembershipResult> {
  if (!supabase) {
    return { error: "Supabase is not configured.", code: null };
  }

  // Validate input
  const validation = validateInput(joinSpaceSchema, { spaceId, userId });
  if (!validation.success) {
    return { error: validation.error, code: "VALIDATION_ERROR" };
  }

  // Check if space exists and has capacity
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("capacity, quorum_count, status")
    .eq("id", spaceId)
    .single();

  if (spaceError || !space) {
    return { error: "Space not found.", code: "NOT_FOUND" };
  }

  if (space.status !== "OPEN") {
    return { error: "This space is no longer accepting members.", code: "SPACE_CLOSED" };
  }

  if (space.quorum_count >= space.capacity) {
    return { error: "This space is full.", code: "SPACE_FULL" };
  }

  const { error } = await supabase
    .from("space_members")
    .insert({ space_id: spaceId, user_id: userId });

  if (!error) {
    return { error: null, code: null };
  }

  // Check for duplicate membership
  if (error.code === "23505") {
    return { error: "You have already joined this space.", code: error.code, duplicate: true };
  }

  console.error("[joinSpace] Error:", error.message);
  return { error: error.message, code: error.code };
}

export async function leaveSpace(
  spaceId: string,
  userId: string
): Promise<MembershipResult> {
  if (!supabase) {
    return { error: "Supabase is not configured.", code: null };
  }

  // Validate input
  const validation = validateInput(leaveSpaceSchema, { spaceId, userId });
  if (!validation.success) {
    return { error: validation.error, code: "VALIDATION_ERROR" };
  }

  const { error } = await supabase
    .from("space_members")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  if (error) {
    console.error("[leaveSpace] Error:", error.message);
    return { error: error.message, code: error.code };
  }

  return { error: null, code: null };
}

export async function removeUserFromSpace(
  spaceId: string,
  targetUserId: string,
  hostId: string
): Promise<MembershipResult> {
  if (!supabase) {
    return { error: "Supabase is not configured.", code: null };
  }

  // Verify the requester is the host
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("host_id")
    .eq("id", spaceId)
    .single();

  if (spaceError || !space) {
    return { error: "Space not found.", code: "NOT_FOUND" };
  }

  if (space.host_id !== hostId) {
    return { error: "Only the host can remove members.", code: "UNAUTHORIZED" };
  }

  const { error } = await supabase
    .from("space_members")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", targetUserId);

  if (error) {
    console.error("[removeUserFromSpace] Error:", error.message);
    return { error: error.message, code: error.code };
  }

  return { error: null, code: null };
}
