import { supabase } from "@/lib/supabaseClient";
import type { OfficialMinyan, TefillahKey } from "@/lib/types";
import { officialMinyanim as hardcodedMinyanim } from "@/lib/officialMinyanim";

const DB_TO_TEFILLAH: Record<string, TefillahKey> = {
  SHACHARIS: "shacharis",
  MINCHA: "mincha",
  MAARIV: "maariv",
};

export async function fetchOfficialMinyanim(): Promise<OfficialMinyan[]> {
  // If Supabase is not configured, use hardcoded data
  if (!supabase) {
    return hardcodedMinyanim;
  }

  try {
    const { data, error } = await supabase
      .from("official_minyanim")
      .select("*")
      .eq("active", true)
      .order("start_time", { ascending: true });

    // If table doesn't exist or any error, fall back to hardcoded data
    if (error) {
      console.warn("[fetchOfficialMinyanim] Falling back to hardcoded data:", error.message);
      return hardcodedMinyanim;
    }

    // If no data returned, use hardcoded data
    if (!data || data.length === 0) {
      return hardcodedMinyanim;
    }

    return data.map((row) => ({
      id: row.id,
      tefillah: DB_TO_TEFILLAH[row.tefillah] ?? "mincha",
      name: row.name,
      shulName: row.shul_name,
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      reliability: row.reliability,
      members: row.avg_members,
      startTime: row.start_time,
    }));
  } catch {
    // Any unexpected error, fall back to hardcoded data
    return hardcodedMinyanim;
  }
}
