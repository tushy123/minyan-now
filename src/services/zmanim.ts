export type ZmanimResponse = {
  date?: string;
  location?: { tzid?: string };
  times?: Record<string, string>;
};

export async function fetchZmanim(params: {
  lat: number;
  lng: number;
  tzid: string;
  date: string;
}) {
  const search = new URLSearchParams({
    lat: params.lat.toString(),
    lng: params.lng.toString(),
    tzid: params.tzid,
    date: params.date,
  });

  const response = await fetch(`/api/zmanim?${search.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load zmanim");
  }
  return (await response.json()) as ZmanimResponse;
}
