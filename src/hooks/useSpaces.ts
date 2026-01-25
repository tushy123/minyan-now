import { useCallback, useEffect, useState } from "react";
import type { SpaceRow } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import {
  createSpace,
  fetchSpaces,
  updateSpace,
  deleteSpace,
  cancelSpace,
} from "@/services/supabase/spaces";
import {
  fetchMemberships,
  joinSpace,
  leaveSpace,
  fetchSpaceMembers,
} from "@/services/supabase/memberships";

export type SpaceMember = {
  userId: string;
  fullName: string | null;
  joinedAt: string;
};

export function useSpaces(userId?: string) {
  const [spaces, setSpaces] = useState<SpaceRow[]>([]);
  const [joinedSpaceIds, setJoinedSpaceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshSpaces = useCallback(async () => {
    setLoading(true);
    const data = await fetchSpaces();
    setSpaces(data);
    setLoading(false);
  }, []);

  const refreshMemberships = useCallback(async () => {
    if (!userId) {
      setJoinedSpaceIds([]);
      return;
    }
    const data = await fetchMemberships(userId);
    setJoinedSpaceIds(data);
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    void refreshSpaces();
  }, [refreshSpaces]);

  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships]);

  // Real-time subscription for spaces
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("spaces-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSpace = payload.new as SpaceRow;
            setSpaces((prev) => [...prev, newSpace].sort(
              (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            ));
          } else if (payload.eventType === "UPDATE") {
            const updatedSpace = payload.new as SpaceRow;
            setSpaces((prev) =>
              prev.map((space) =>
                space.id === updatedSpace.id ? { ...space, ...updatedSpace } : space
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setSpaces((prev) => prev.filter((space) => space.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Real-time subscription for memberships (to track quorum changes)
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel("memberships-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "space_members",
        },
        () => {
          // Refresh memberships when any change happens
          void refreshMemberships();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, refreshMemberships]);

  const createNewSpace = useCallback(
    async (payload: Parameters<typeof createSpace>[0]) => {
      const result = await createSpace(payload);
      if (result.error) {
        return { data: null, error: result.error };
      }
      // Real-time will handle the update, but refresh to be safe
      await refreshSpaces();
      await refreshMemberships();
      return { data: result.data, error: null };
    },
    [refreshSpaces, refreshMemberships]
  );

  const updateExistingSpace = useCallback(
    async (
      spaceId: string,
      updates: Parameters<typeof updateSpace>[2]
    ) => {
      if (!userId) {
        return { data: null, error: "Please sign in." };
      }
      const result = await updateSpace(spaceId, userId, updates);
      if (result.error) {
        return { data: null, error: result.error };
      }
      return { data: result.data, error: null };
    },
    [userId]
  );

  const deleteExistingSpace = useCallback(
    async (spaceId: string) => {
      if (!userId) {
        return { error: "Please sign in." };
      }
      const result = await deleteSpace(spaceId, userId);
      if (result.error) {
        return { error: result.error };
      }
      return { error: null };
    },
    [userId]
  );

  const cancelExistingSpace = useCallback(
    async (spaceId: string) => {
      if (!userId) {
        return { data: null, error: "Please sign in." };
      }
      const result = await cancelSpace(spaceId, userId);
      if (result.error) {
        return { data: null, error: result.error };
      }
      return { data: result.data, error: null };
    },
    [userId]
  );

  const joinExistingSpace = useCallback(
    async (spaceId: string) => {
      if (!userId) {
        return { error: "Please sign in.", duplicate: false };
      }
      const { error, code, duplicate } = await joinSpace(spaceId, userId);
      if (error && !duplicate) {
        return { error, duplicate: false };
      }
      await refreshMemberships();
      return { error: null, duplicate: duplicate ?? false };
    },
    [userId, refreshMemberships]
  );

  const leaveExistingSpace = useCallback(
    async (spaceId: string) => {
      if (!userId) {
        return { error: "Please sign in." };
      }
      const { error } = await leaveSpace(spaceId, userId);
      if (error) {
        return { error };
      }
      await refreshMemberships();
      return { error: null };
    },
    [userId, refreshMemberships]
  );

  const getSpaceMembers = useCallback(async (spaceId: string): Promise<SpaceMember[]> => {
    return fetchSpaceMembers(spaceId);
  }, []);

  return {
    spaces,
    joinedSpaceIds,
    loading,
    refreshSpaces,
    refreshMemberships,
    createNewSpace,
    updateExistingSpace,
    deleteExistingSpace,
    cancelExistingSpace,
    joinExistingSpace,
    leaveExistingSpace,
    getSpaceMembers,
  };
}
