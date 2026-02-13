import { useCallback, useEffect, useRef, useState } from "react";

export type AddressSuggestion = {
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function useAddressAutocomplete(near?: { lat: number; lng: number }) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef(crypto.randomUUID());

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const search = useCallback(
    (query: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (!API_KEY || query.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          // Step 1: Autocomplete
          const body: Record<string, unknown> = {
            input: query,
            sessionToken: sessionTokenRef.current,
          };
          if (near) {
            body.locationBias = {
              circle: {
                center: { latitude: near.lat, longitude: near.lng },
                radius: 50000,
              },
            };
          }

          const acRes = await fetch(
            "https://places.googleapis.com/v1/places:autocomplete",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": API_KEY,
              },
              body: JSON.stringify(body),
              signal: controller.signal,
            }
          );

          if (!acRes.ok) {
            setSuggestions([]);
            setLoading(false);
            return;
          }

          const acJson = await acRes.json();
          const predictions = acJson.suggestions ?? [];

          // Step 2: Fetch place details for each to get lat/lng
          const results: AddressSuggestion[] = [];
          for (const suggestion of predictions.slice(0, 5)) {
            const pred = suggestion.placePrediction;
            if (!pred?.placeId) continue;

            const detailRes = await fetch(
              `https://places.googleapis.com/v1/places/${pred.placeId}?languageCode=en`,
              {
                headers: {
                  "X-Goog-Api-Key": API_KEY,
                  "X-Goog-FieldMask": "location,formattedAddress",
                },
                signal: controller.signal,
              }
            );

            if (!detailRes.ok) continue;
            const detail = await detailRes.json();

            if (detail.location) {
              results.push({
                formattedAddress: detail.formattedAddress ?? pred.text?.text ?? "",
                placeId: pred.placeId,
                latitude: detail.location.latitude,
                longitude: detail.location.longitude,
              });
            }
          }

          setSuggestions(results);
        } catch {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    [near]
  );

  const clear = useCallback(() => {
    setSuggestions([]);
    // New session for next search
    sessionTokenRef.current = crypto.randomUUID();
  }, []);

  return { suggestions, loading, search, clear };
}
