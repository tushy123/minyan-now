import type { SpaceRow, TefillahKey, ZmanWindow } from "@/lib/types";

export const DEFAULT_CENTER = { lat: 31.7683, lng: 35.2137 };

export const WALKING_METERS_PER_MIN = 80;
export const METERS_PER_MILE = 1609.34;

export const TEFILLAH_LABELS: Record<TefillahKey, string> = {
  shacharis: "Shacharit",
  mincha: "Mincha",
  maariv: "Maariv",
};

export const TEFILLAH_TO_DB: Record<TefillahKey, SpaceRow["tefillah"]> = {
  shacharis: "SHACHARIS",
  mincha: "MINCHA",
  maariv: "MAARIV",
};

export const DB_TO_TEFILLAH: Record<SpaceRow["tefillah"], TefillahKey> = {
  SHACHARIS: "shacharis",
  MINCHA: "mincha",
  MAARIV: "maariv",
};

export const ZMAN_WINDOWS: Record<TefillahKey, ZmanWindow> = {
  shacharis: { start: 5 * 60, end: 12 * 60 - 5 },
  mincha: { start: 12 * 60, end: 20 * 60 - 5 },
  maariv: { start: 19 * 60, end: 24 * 60 - 5 },
};
