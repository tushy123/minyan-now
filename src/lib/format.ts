export function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function parseTimeLabel(timeText: string) {
  const match = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function formatTimeFromMinutes(totalMinutes: number) {
  const minutesInDay = 24 * 60;
  let minutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  if (hours > 12) hours -= 12;
  return `${hours}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function toMinutesFromDate(value: Date) {
  return value.getHours() * 60 + value.getMinutes();
}

export function dateFromMinutes(base: Date, totalMinutes: number) {
  const minutesInDay = 24 * 60;
  const daysOffset = Math.floor(totalMinutes / minutesInDay);
  const normalizedMinutes =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const date = new Date(base);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(
    Math.floor(normalizedMinutes / 60),
    normalizedMinutes % 60,
    0,
    0,
  );
  return date;
}
