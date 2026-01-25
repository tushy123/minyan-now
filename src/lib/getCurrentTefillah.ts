import type { TefillahKey, ZmanWindow } from "./types";

/**
 * Determines which tefillah time window the current time falls into
 * Checks in reverse order (maariv, mincha, shacharis) so later prayers
 * take precedence during overlapping time windows
 */
export function getCurrentTefillah(windows: Record<TefillahKey, ZmanWindow>): TefillahKey {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check each tefillah window in reverse order (later prayers take precedence)
  for (const tefillah of ["maariv", "mincha", "shacharis"] as TefillahKey[]) {
    const window = windows[tefillah];

    // Handle windows that span midnight (end > 24 hours)
    if (window.end > 24 * 60) {
      // Window spans midnight
      if (currentMinutes >= window.start || currentMinutes <= (window.end % (24 * 60))) {
        return tefillah;
      }
    } else {
      // Normal window within same day
      if (currentMinutes >= window.start && currentMinutes <= window.end) {
        return tefillah;
      }
    }
  }

  // Default to mincha if we're outside all windows (shouldn't happen with proper windows)
  return "mincha";
}
