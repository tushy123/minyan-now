import { NextResponse } from "next/server";

function parseNumber(value: string | null) {
  if (!value) return null;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseNumber(searchParams.get("lat"));
  const lng = parseNumber(searchParams.get("lng"));
  const tzid = searchParams.get("tzid");
  const date = searchParams.get("date");

  if (lat === null || lng === null || !tzid || !date) {
    return NextResponse.json(
      { error: "Missing or invalid lat/lng/tzid/date" },
      { status: 400 },
    );
  }

  const hebcalUrl = new URL("https://www.hebcal.com/zmanim");
  hebcalUrl.searchParams.set("cfg", "json");
  hebcalUrl.searchParams.set("latitude", lat.toString());
  hebcalUrl.searchParams.set("longitude", lng.toString());
  hebcalUrl.searchParams.set("tzid", tzid);
  hebcalUrl.searchParams.set("date", date);
  hebcalUrl.searchParams.set("sec", "1");

  try {
    const response = await fetch(hebcalUrl.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch zmanim" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
