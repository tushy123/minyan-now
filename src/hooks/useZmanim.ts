import { useEffect, useState } from "react";
import type { TefillahKey, ZmanWindow } from "@/lib/types";
import { DEFAULT_CENTER, ZMAN_WINDOWS } from "@/lib/constants";
import { formatTimeFromMinutes } from "@/lib/format";
import { fetchZmanim } from "@/services/zmanim";

const MINUTES_IN_DAY = 24 * 60;

type ZmanLabels = Record<TefillahKey, { start: string; end: string }>;

export type AllZmanim = {
  alotHaShachar?: string;
  misheyakir?: string;
  sunrise?: string;
  sofZmanShma?: string;
  sofZmanTfilla?: string;
  chatzot?: string;
  minchaGedola?: string;
  minchaKetana?: string;
  plagHaMincha?: string;
  sunset?: string;
  beinHaShmashos?: string;
  tzeit?: string;
  chatzotNight?: string;
};

type ZmanimState = {
  windows: Record<TefillahKey, ZmanWindow>;
  labels: ZmanLabels;
  allZmanim: AllZmanim;
  loading: boolean;
  error: string | null;
  source: "api" | "fallback";
};

function getDateStringInTimeZone(timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }
    if (values.year && values.month && values.day) {
      return `${values.year}-${values.month}-${values.day}`;
    }
  } catch (error) {
    console.warn("Failed to format date for timezone", error);
  }
  return new Date().toISOString().slice(0, 10);
}

function parseMinutes(value?: string | null) {
  if (!value) return null;
  const match = value.match(/T(\\d{2}):(\\d{2})/);
  if (match) {
    return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function getMinutes(times: Record<string, string> | undefined, keys: string[]) {
  if (!times) return null;
  for (const key of keys) {
    const minutes = parseMinutes(times[key]);
    if (minutes !== null) return minutes;
  }
  return null;
}

function normalizeWindow(start: number, end: number): ZmanWindow {
  if (end <= start) {
    return { start, end: end + MINUTES_IN_DAY };
  }
  return { start, end };
}

function formatTimeFromISO(isoString?: string): string | undefined {
  if (!isoString) return undefined;
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }
  return undefined;
}

function buildFallbackState(): Pick<ZmanimState, "windows" | "labels" | "allZmanim" | "source"> {
  const labels = {
    shacharis: {
      start: formatTimeFromMinutes(ZMAN_WINDOWS.shacharis.start),
      end: formatTimeFromMinutes(ZMAN_WINDOWS.shacharis.end),
    },
    mincha: {
      start: formatTimeFromMinutes(ZMAN_WINDOWS.mincha.start),
      end: formatTimeFromMinutes(ZMAN_WINDOWS.mincha.end),
    },
    maariv: {
      start: formatTimeFromMinutes(ZMAN_WINDOWS.maariv.start),
      end: formatTimeFromMinutes(ZMAN_WINDOWS.maariv.end),
    },
  } satisfies ZmanLabels;

  return {
    windows: ZMAN_WINDOWS,
    labels,
    allZmanim: {},
    source: "fallback",
  };
}

export function useZmanim(origin?: { lat: number; lng: number }): ZmanimState {
  const lat = origin?.lat ?? DEFAULT_CENTER.lat;
  const lng = origin?.lng ?? DEFAULT_CENTER.lng;
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [date, setDate] = useState(() => getDateStringInTimeZone(tzid));

  const [state, setState] = useState<ZmanimState>(() => ({
    ...buildFallbackState(),
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(getDateStringInTimeZone(tzid));
    }, 60_000);
    return () => clearInterval(interval);
  }, [tzid]);

  useEffect(() => {
    let active = true;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchZmanim({ lat, lng, tzid, date });
        const times = data.times ?? {};

        const shacharisStart =
          getMinutes(times, ["misheyakir", "alotHaShachar", "sunrise"]) ??
          ZMAN_WINDOWS.shacharis.start;
        const shacharisEnd =
          getMinutes(times, ["sofZmanTfilla", "sofZmanShma", "chatzot"]) ??
          ZMAN_WINDOWS.shacharis.end;

        const minchaStart =
          getMinutes(times, ["minchaGedola", "chatzot"]) ?? ZMAN_WINDOWS.mincha.start;
        const minchaEnd = getMinutes(times, ["sunset", "tzeit"]) ?? ZMAN_WINDOWS.mincha.end;

        const maarivStart =
          getMinutes(times, ["tzeit7083deg", "tzeit85deg", "tzeit", "sunset"]) ??
          ZMAN_WINDOWS.maariv.start;
        const maarivEnd =
          getMinutes(times, ["chatzotNight", "chatzot"]) ?? ZMAN_WINDOWS.maariv.end;

        const windows: Record<TefillahKey, ZmanWindow> = {
          shacharis: normalizeWindow(shacharisStart, shacharisEnd),
          mincha: normalizeWindow(minchaStart, minchaEnd),
          maariv: normalizeWindow(maarivStart, maarivEnd),
        };

        const labels: ZmanLabels = {
          shacharis: {
            start: formatTimeFromMinutes(shacharisStart),
            end: formatTimeFromMinutes(shacharisEnd),
          },
          mincha: {
            start: formatTimeFromMinutes(minchaStart),
            end: formatTimeFromMinutes(minchaEnd),
          },
          maariv: {
            start: formatTimeFromMinutes(maarivStart),
            end: formatTimeFromMinutes(maarivEnd),
          },
        };

        // Extract all zmanim for detailed view
        const allZmanim: AllZmanim = {
          alotHaShachar: formatTimeFromISO(times.alotHaShachar),
          misheyakir: formatTimeFromISO(times.misheyakir),
          sunrise: formatTimeFromISO(times.sunrise),
          sofZmanShma: formatTimeFromISO(times.sofZmanShma),
          sofZmanTfilla: formatTimeFromISO(times.sofZmanTfilla),
          chatzot: formatTimeFromISO(times.chatzot),
          minchaGedola: formatTimeFromISO(times.minchaGedola),
          minchaKetana: formatTimeFromISO(times.minchaKetana),
          plagHaMincha: formatTimeFromISO(times.plagHaMincha),
          sunset: formatTimeFromISO(times.sunset),
          beinHaShmashos: formatTimeFromISO(times.beinHaShmashos),
          tzeit: formatTimeFromISO(times.tzeit7083deg || times.tzeit85deg || times.tzeit),
          chatzotNight: formatTimeFromISO(times.chatzotNight),
        };

        if (active) {
          setState({ windows, labels, allZmanim, loading: false, error: null, source: "api" });
        }
      } catch (error) {
        if (active) {
          const fallback = buildFallbackState();
          setState({ ...fallback, loading: false, error: "Unable to load zmanim" });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [lat, lng, tzid, date]);

  return state;
}
