import type { SpaceRow } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { createSpaceSchema, updateSpaceSchema, validateInput } from "@/lib/validations";

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export async function fetchSpaces(): Promise<SpaceRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("spaces")
    .select(
      "id, tefillah, start_time, lat, lng, map_x, map_y, address, notes, status, capacity, quorum_count, presence_rule, host_id, host:profiles!host_id(id, full_name, reliability, streak)"
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[fetchSpaces] Error:", error.message);
    return [];
  }

  // Transform data to handle Supabase returning host as array
  return (data ?? []).map((row) => {
    const host = Array.isArray(row.host) ? row.host[0] : row.host;
    return {
      ...row,
      host: host ?? null,
    } as SpaceRow;
  });
}

export async function fetchSpaceById(spaceId: string): Promise<ServiceResult<SpaceRow>> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("spaces")
    .select(
      "id, tefillah, start_time, lat, lng, map_x, map_y, address, notes, status, capacity, quorum_count, presence_rule, host_id, host:profiles!host_id(id, full_name, reliability, streak)"
    )
    .eq("id", spaceId)
    .single();

  if (error) {
    console.error("[fetchSpaceById] Error:", error.message);
    return { data: null, error: error.message };
  }

  // Transform data to handle Supabase returning host as array
  const host = Array.isArray(data.host) ? data.host[0] : data.host;
  return {
    data: {
      ...data,
      host: host ?? null,
    } as SpaceRow,
    error: null,
  };
}

export async function createSpace(payload: {
  tefillah: SpaceRow["tefillah"];
  start_time: string;
  lat: number;
  lng: number;
  map_x: number;
  map_y: number;
  address: string | null;
  notes: string | null;
  status: SpaceRow["status"];
  capacity: number;
  quorum_count: number;
  host_id: string;
  presence_rule: string | null;
}): Promise<ServiceResult<{ id: string }>> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  // Validate input
  const validation = validateInput(createSpaceSchema, payload);
  if (!validation.success) {
    return { data: null, error: validation.error };
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert(validation.data)
    .select("id")
    .single();

  if (error) {
    console.error("[createSpace] Error:", error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateSpace(
  spaceId: string,
  hostId: string,
  updates: {
    start_time?: string;
    address?: string | null;
    notes?: string | null;
    status?: SpaceRow["status"];
    capacity?: number;
  }
): Promise<ServiceResult<SpaceRow>> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  // Validate input
  const validation = validateInput(updateSpaceSchema, { id: spaceId, ...updates });
  if (!validation.success) {
    return { data: null, error: validation.error };
  }

  // First verify the user is the host
  const { data: existingSpace, error: fetchError } = await supabase
    .from("spaces")
    .select("host_id")
    .eq("id", spaceId)
    .single();

  if (fetchError || !existingSpace) {
    return { data: null, error: "Space not found." };
  }

  if (existingSpace.host_id !== hostId) {
    return { data: null, error: "Only the host can update this space." };
  }

  const { data, error } = await supabase
    .from("spaces")
    .update(updates)
    .eq("id", spaceId)
    .select(
      "id, tefillah, start_time, lat, lng, map_x, map_y, address, notes, status, capacity, quorum_count, presence_rule, host_id, host:profiles!host_id(id, full_name, reliability, streak)"
    )
    .single();

  if (error) {
    console.error("[updateSpace] Error:", error.message);
    return { data: null, error: error.message };
  }

  // Transform data to handle Supabase returning host as array
  const host = Array.isArray(data.host) ? data.host[0] : data.host;
  return {
    data: {
      ...data,
      host: host ?? null,
    } as SpaceRow,
    error: null,
  };
}

export async function deleteSpace(
  spaceId: string,
  hostId: string
): Promise<ServiceResult<{ deleted: true }>> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  // First verify the user is the host
  const { data: existingSpace, error: fetchError } = await supabase
    .from("spaces")
    .select("host_id")
    .eq("id", spaceId)
    .single();

  if (fetchError || !existingSpace) {
    return { data: null, error: "Space not found." };
  }

  if (existingSpace.host_id !== hostId) {
    return { data: null, error: "Only the host can delete this space." };
  }

  const { error } = await supabase
    .from("spaces")
    .delete()
    .eq("id", spaceId);

  if (error) {
    console.error("[deleteSpace] Error:", error.message);
    return { data: null, error: error.message };
  }

  return { data: { deleted: true }, error: null };
}

export async function cancelSpace(
  spaceId: string,
  hostId: string
): Promise<ServiceResult<SpaceRow>> {
  return updateSpace(spaceId, hostId, { status: "CANCELLED" });
}
