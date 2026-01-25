import { haversineMeters } from "@/lib/geo";
import { METERS_PER_MILE, WALKING_METERS_PER_MIN } from "@/lib/constants";

export function getDistanceInfo(
  lat: number,
  lng: number,
  origin: { lat: number; lng: number },
) {
  const meters = haversineMeters(origin.lat, origin.lng, lat, lng);
  const miles = meters / METERS_PER_MILE;
  const distanceLabel = `${miles.toFixed(1)} miles`;
  const etaMinutes = Math.max(1, Math.round(meters / WALKING_METERS_PER_MIN));
  const etaLabel = `${etaMinutes} min walk`;
  return { distanceMiles: miles, distanceLabel, etaLabel };
}
