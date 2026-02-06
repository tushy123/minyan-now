import { useEffect, useState, useCallback } from "react";
import type { FriendRequest, Friendship, Profile } from "@/lib/types";
import {
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  searchUsers,
  inviteFriendToMinyan,
  getMinyanInvites,
  respondToMinyanInvite,
  getFriendsInSpace,
} from "@/services/supabase/friends";

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [minyanInvites, setMinyanInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setMinyanInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [friendsRes, pendingRes, sentRes, invitesRes] = await Promise.all([
      getFriends(),
      getPendingFriendRequests(),
      getSentFriendRequests(),
      getMinyanInvites(),
    ]);

    setFriends(friendsRes.data);
    setPendingRequests(pendingRes.data);
    setSentRequests(sentRes.data);
    setMinyanInvites(invitesRes.data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendRequest = useCallback(async (toUserId: string) => {
    const result = await sendFriendRequest(toUserId);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const acceptRequest = useCallback(async (requestId: string) => {
    const result = await respondToFriendRequest(requestId, true);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const declineRequest = useCallback(async (requestId: string) => {
    const result = await respondToFriendRequest(requestId, false);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const unfriend = useCallback(async (friendId: string) => {
    const result = await removeFriend(friendId);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const search = useCallback(async (query: string) => {
    return searchUsers(query);
  }, []);

  const inviteToMinyan = useCallback(async (spaceId: string, friendId: string) => {
    return inviteFriendToMinyan(spaceId, friendId);
  }, []);

  const acceptMinyanInvite = useCallback(async (inviteId: string) => {
    const result = await respondToMinyanInvite(inviteId, true);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const declineMinyanInvite = useCallback(async (inviteId: string) => {
    const result = await respondToMinyanInvite(inviteId, false);
    if (!result.error) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const getFriendsInMinyan = useCallback(async (spaceId: string) => {
    return getFriendsInSpace(spaceId);
  }, []);

  return {
    friends,
    pendingRequests,
    sentRequests,
    minyanInvites,
    loading,
    refresh,
    sendRequest,
    acceptRequest,
    declineRequest,
    unfriend,
    search,
    inviteToMinyan,
    acceptMinyanInvite,
    declineMinyanInvite,
    getFriendsInMinyan,
    pendingCount: pendingRequests.length + minyanInvites.length,
  };
}
