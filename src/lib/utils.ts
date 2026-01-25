export function createInitials(name?: string | null, fallback = "MN") {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return initials.join("") || fallback;
}
