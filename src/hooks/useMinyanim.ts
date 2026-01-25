import { useMemo, useState, useCallback, useEffect } from "react";
import type { SpaceRow, TefillahKey, UiItem, UiSet, UiSpace, OfficialMinyan } from "@/lib/types";
import { DB_TO_TEFILLAH } from "@/lib/constants";
import { formatTimeLabel, parseTimeLabel, toMinutesFromDate } from "@/lib/format";
import { getDistanceInfo } from "@/lib/distance";
import { fetchOfficialMinyanim } from "@/services/supabase/officialMinyanim";

export type SortOption = "closest" | "soonest" | "fullest" | "reliable";
export type FilterType = "all" | "space" | "set";

interface UseMinyanFiltersOptions {
  spaces: SpaceRow[];
  joinedSpaceIds: string[];
  origin: { lat: number; lng: number };
  initialTefillah?: TefillahKey;
}

export function useMinyanim({
  spaces,
  joinedSpaceIds,
  origin,
  initialTefillah = "mincha",
}: UseMinyanFiltersOptions) {
  const [officialMinyanim, setOfficialMinyanim] = useState<OfficialMinyan[]>([]);
  const [currentFilter, setCurrentFilter] = useState<TefillahKey>(initialTefillah);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("closest");
  const [maxDistance, setMaxDistance] = useState(2);

  // Fetch official minyanim from database
  useEffect(() => {
    fetchOfficialMinyanim().then(setOfficialMinyanim);
  }, []);

  // Transform spaces to UI format
  const uiSpaces = useMemo<UiSpace[]>(() => {
    return spaces.map((space) => {
      const startDate = new Date(space.start_time);
      const { distanceMiles, distanceLabel, etaLabel } = getDistanceInfo(
        space.lat,
        space.lng,
        origin
      );
      return {
        id: space.id,
        type: "space",
        tefillah: DB_TO_TEFILLAH[space.tefillah],
        startTime: formatTimeLabel(startDate),
        startMinutes: toMinutesFromDate(startDate),
        lat: space.lat,
        lng: space.lng,
        address: space.address ?? "Location shared upon join",
        distanceMiles,
        distanceLabel,
        etaLabel,
        members: space.quorum_count,
        capacity: space.capacity,
        hostName: space.host?.full_name ?? "Host",
        notes: space.notes ?? undefined,
        joined: joinedSpaceIds.includes(space.id),
      };
    });
  }, [spaces, origin, joinedSpaceIds]);

  // Transform official minyanim to UI format
  const uiSetMinyanim = useMemo<UiSet[]>(() => {
    return officialMinyanim.map((minyan) => {
      const { distanceMiles, distanceLabel, etaLabel } = getDistanceInfo(
        minyan.lat,
        minyan.lng,
        origin
      );
      return {
        id: minyan.id,
        type: "set",
        tefillah: minyan.tefillah,
        startTime: minyan.startTime,
        startMinutes: parseTimeLabel(minyan.startTime),
        lat: minyan.lat,
        lng: minyan.lng,
        address: minyan.address,
        distanceMiles,
        distanceLabel,
        etaLabel,
        members: minyan.members,
        capacity: 10,
        shulName: minyan.shulName,
        reliability: minyan.reliability,
      };
    });
  }, [officialMinyanim, origin]);

  // Combine all items
  const allItems = useMemo<UiItem[]>(
    () => [...uiSpaces, ...uiSetMinyanim],
    [uiSpaces, uiSetMinyanim]
  );

  // Filter items
  const filteredItems = useMemo<UiItem[]>(() => {
    return allItems.filter((item) => {
      if (item.tefillah !== currentFilter) return false;
      if (filterType !== "all" && item.type !== filterType) return false;
      if (item.distanceMiles > maxDistance) return false;
      return true;
    });
  }, [allItems, currentFilter, filterType, maxDistance]);

  // Sort items
  const sortedItems = useMemo<UiItem[]>(() => {
    const items = [...filteredItems];
    items.sort((a, b) => {
      // Joined spaces always first
      const aJoined = a.type === "space" && a.joined ? 1 : 0;
      const bJoined = b.type === "space" && b.joined ? 1 : 0;
      if (aJoined !== bJoined) return bJoined - aJoined;

      switch (sortBy) {
        case "closest":
          return a.distanceMiles - b.distanceMiles;
        case "soonest":
          return a.startMinutes - b.startMinutes;
        case "fullest":
          return b.members - a.members;
        case "reliable": {
          const aRel = a.type === "set" ? a.reliability ?? 0 : 0;
          const bRel = b.type === "set" ? b.reliability ?? 0 : 0;
          return bRel - aRel;
        }
        default:
          return 0;
      }
    });
    return items;
  }, [filteredItems, sortBy]);

  // Check if user has joined any space
  const hasJoinedSpace = useMemo(
    () => uiSpaces.some((space) => space.joined),
    [uiSpaces]
  );

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilterType("all");
    setSortBy("closest");
    setMaxDistance(2);
  }, []);

  return {
    // Data
    sortedItems,
    allItems,
    uiSpaces,
    uiSetMinyanim,
    hasJoinedSpace,

    // Filter state
    currentFilter,
    filterType,
    sortBy,
    maxDistance,

    // Filter actions
    setCurrentFilter,
    setFilterType,
    setSortBy,
    setMaxDistance,
    resetFilters,
  };
}
