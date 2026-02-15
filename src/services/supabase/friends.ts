import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { FriendRequest, Friendship, Profile } from "@/lib/types";

// ==================== FRIEND REQUESTS ====================

export async function sendFriendRequest(toUserId: string): Promise<{ data: FriendRequest | null; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Check if already friends
  const { data: existingFriendship } = await supabase
    .from("friendships")
    .select("id")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${user.id})`)
    .single();

  if (existingFriendship) {
    return { data: null, error: "Already friends" };
  }

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("*")
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${user.id})`)
    .eq("status", "pending")
    .single();

  if (existingRequest) {
    return { data: null, error: "Friend request already pending" };
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ from_user_id: user.id, to_user_id: toUserId })
    .select("*, from_user:profiles!friend_requests_from_user_id_fkey(*)")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as FriendRequest, error: null };
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
): Promise<{ error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: "Database not configured" };
  }

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getPendingFriendRequests(): Promise<{ data: FriendRequest[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, from_user:profiles!friend_requests_from_user_id_fkey(*)")
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as FriendRequest[], error: null };
}

export async function getSentFriendRequests(): Promise<{ data: FriendRequest[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, to_user:profiles!friend_requests_to_user_id_fkey(*)")
    .eq("from_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as FriendRequest[], error: null };
}

// ==================== FRIENDSHIPS ====================

export async function getFriends(): Promise<{ data: Friendship[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("*, friend:profiles!friendships_friend_id_fkey(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as Friendship[], error: null };
}

export async function removeFriend(friendId: string): Promise<{ error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Delete both directions of the friendship
  const { error: error1 } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", friendId);

  const { error: error2 } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", friendId)
    .eq("friend_id", user.id);

  if (error1 || error2) {
    return { error: error1?.message || error2?.message || "Failed to remove friend" };
  }

  return { error: null };
}

// ==================== USER SEARCH ====================

export async function searchUsers(query: string): Promise<{ data: Profile[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  if (!query || query.length < 2) {
    return { data: [], error: null };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("full_name", `%${query}%`)
    .neq("id", user?.id || "")
    .limit(10);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as Profile[], error: null };
}

// ==================== MINYAN INVITES ====================

export async function inviteFriendToMinyan(
  spaceId: string,
  friendId: string
): Promise<{ error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("minyan_invites")
    .insert({
      space_id: spaceId,
      from_user_id: user.id,
      to_user_id: friendId,
    });

  if (error) {
    if (error.code === "23505") {
      return { error: "Already invited" };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function getMinyanInvites(): Promise<{ data: any[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("minyan_invites")
    .select(`
      *,
      from_user:profiles!minyan_invites_from_user_id_fkey(*),
      space:spaces(*)
    `)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

export async function respondToMinyanInvite(
  inviteId: string,
  accept: boolean
): Promise<{ error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { error: "Database not configured" };
  }

  const { error } = await supabase
    .from("minyan_invites")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", inviteId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ==================== FRIENDS IN MINYAN ====================

export async function getFriendsInSpace(spaceId: string): Promise<{ data: Profile[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: [], error: "Database not configured" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  // Get user's friends
  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id);

  if (!friendships || friendships.length === 0) {
    return { data: [], error: null };
  }

  const friendIds = friendships.map(f => f.friend_id);

  // Get which friends are in this space
  const { data: members, error } = await supabase
    .from("space_members")
    .select("user_id, profiles:profiles!space_members_user_id_fkey(*)")
    .eq("space_id", spaceId)
    .in("user_id", friendIds);

  if (error) {
    return { data: [], error: error.message };
  }

  const friends = (members?.map(m => m.profiles).filter(Boolean) || []) as unknown as Profile[];
  return { data: friends, error: null };
}

// ==================== PROFILE LOOKUP ====================

export async function fetchProfileById(userId: string): Promise<{
  profile: Profile | null;
  joinedCount: number;
  hostedCount: number;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return { profile: null, joinedCount: 0, hostedCount: 0 };
  }

  const { data: profileData, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profileData) {
    return { profile: null, joinedCount: 0, hostedCount: 0 };
  }

  const [{ count: joinedCount }, { count: hostedCount }] = await Promise.all([
    supabase
      .from("space_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("spaces")
      .select("*", { count: "exact", head: true })
      .eq("host_id", userId),
  ]);

  return {
    profile: profileData as Profile,
    joinedCount: joinedCount ?? 0,
    hostedCount: hostedCount ?? 0,
  };
}

// ==================== USER PRESENCE ====================

export async function updateUserPresence(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("update_user_presence", { p_user_id: user.id });
}

export async function setUserOffline(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("set_user_offline", { p_user_id: user.id });
}

export async function getOnlineUserCount(): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0;

  const { data, error } = await supabase.rpc("get_online_user_count");

  if (error) {
    console.error("Error getting online count:", error);
    return 0;
  }

  return data || 0;
}
