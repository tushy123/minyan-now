import { supabase } from "@/lib/supabaseClient";
import type { OfficialMinyan, TefillahKey, DayKey } from "@/lib/types";
import { officialMinyanim as hardcodedMinyanim } from "@/lib/officialMinyanim";

const DB_TO_TEFILLAH: Record<string, TefillahKey> = {
  SHACHARIS: "shacharis",
  MINCHA: "mincha",
  MAARIV: "maariv",
};

/** Map JS day index (0=Sun) to our DayKey */
function getTodayDayKey(): DayKey {
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "shabbat"];
  return map[new Date().getDay()];
}

/**
 * Fetch official minyanim from the new shuls + shul_schedules tables.
 * Falls back to the legacy official_minyanim table, then to hardcoded data.
 */
export async function fetchOfficialMinyanim(): Promise<OfficialMinyan[]> {
  if (!supabase) return hardcodedMinyanim;

  const today = getTodayDayKey();
  const todayDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  try {
    // 1. Try fetching from new shul_schedules + shuls tables
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("shul_schedules")
      .select("*, shul:shuls(*)")
      .eq("active", true)
      .contains("days", [today]);

    if (!scheduleError && scheduleData && scheduleData.length > 0) {
      // Also fetch today's overrides
      const shulIds = [...new Set(scheduleData.map((s: Record<string, unknown>) => (s.shul as Record<string, unknown>)?.id).filter(Boolean))] as string[];

      let overrides: Record<string, unknown>[] = [];
      if (shulIds.length > 0) {
        const { data: overrideData } = await supabase
          .from("schedule_overrides")
          .select("*")
          .in("shul_id", shulIds)
          .eq("override_date", todayDate);

        overrides = (overrideData ?? []) as Record<string, unknown>[];
      }

      const results: OfficialMinyan[] = [];

      for (const row of scheduleData) {
        const shul = row.shul as Record<string, unknown> | null;
        if (!shul) continue;

        const scheduleId = row.id as string;
        const shulId = shul.id as string;

        // Check for overrides on this schedule
        const override = overrides.find(
          (o) => (o.schedule_id === scheduleId || o.schedule_id === null) && o.shul_id === shulId
        );

        if (override) {
          if (override.override_type === "cancelled") continue; // Skip cancelled
          if (override.override_type === "time_change" && override.new_time) {
            // Use overridden time
            results.push({
              id: scheduleId,
              tefillah: DB_TO_TEFILLAH[row.tefillah as string] ?? "mincha",
              name: (row.name as string) ?? `${DB_TO_TEFILLAH[row.tefillah as string] ?? "Minyan"}`,
              shulName: shul.name as string,
              lat: shul.lat as number,
              lng: shul.lng as number,
              address: shul.address as string,
              reliability: 95,
              members: 10,
              startTime: override.new_time as string,
            });
            continue;
          }
        }

        // Normal schedule (no override)
        results.push({
          id: scheduleId,
          tefillah: DB_TO_TEFILLAH[row.tefillah as string] ?? "mincha",
          name: (row.name as string) ?? `${DB_TO_TEFILLAH[row.tefillah as string] ?? "Minyan"}`,
          shulName: shul.name as string,
          lat: shul.lat as number,
          lng: shul.lng as number,
          address: shul.address as string,
          reliability: 95,
          members: 10,
          startTime: row.start_time as string,
        });
      }

      // Also check for "added" overrides (one-off minyanim for today)
      const addedOverrides = overrides.filter((o) => o.override_type === "added");
      for (const added of addedOverrides) {
        const shul = scheduleData.find(
          (s: Record<string, unknown>) => (s.shul as Record<string, unknown>)?.id === added.shul_id
        )?.shul as Record<string, unknown> | undefined;

        if (shul && added.new_time) {
          results.push({
            id: added.id as string,
            tefillah: DB_TO_TEFILLAH[added.tefillah as string] ?? "mincha",
            name: (added.reason as string) ?? "Special Minyan",
            shulName: shul.name as string,
            lat: shul.lat as number,
            lng: shul.lng as number,
            address: shul.address as string,
            reliability: 95,
            members: 10,
            startTime: added.new_time as string,
          });
        }
      }

      return results;
    }

    // 2. Fall back to legacy official_minyanim table
    const { data, error } = await supabase
      .from("official_minyanim")
      .select("*")
      .eq("active", true)
      .order("start_time", { ascending: true });

    if (error) {
      console.warn("[fetchOfficialMinyanim] Falling back to hardcoded data:", error.message);
      return hardcodedMinyanim;
    }

    if (!data || data.length === 0) return hardcodedMinyanim;

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
    return hardcodedMinyanim;
  }
}
