import { useEffect, useState, useRef, useCallback } from "react";

export function useLocation(onError?: (message: string) => void) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [manualLocationLoading, setManualLocationLoading] = useState(false);
  const [manualLocationError, setManualLocationError] = useState<string | null>(null);

  // Use refs to avoid dependency issues
  const onErrorRef = useRef(onError);
  const hasRequestedRef = useRef(false);

  // Keep ref updated
  onErrorRef.current = onError;

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setManualLocationError(null);
        setPermissionState("granted");
      },
      (error) => {
        setPermissionState("denied");
        // Only show error toast on manual request, not auto-request
        if (hasRequestedRef.current && onErrorRef.current) {
          if (error.code === error.PERMISSION_DENIED) {
            onErrorRef.current("Location access denied. Enable in your browser settings.");
          } else {
            onErrorRef.current("Unable to get your location. Please check your settings.");
          }
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );

    hasRequestedRef.current = true;
  }, []); // No dependencies - uses refs

  const resolveManualLocation = useCallback(async (query: string): Promise<boolean> => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setManualLocationError("Enter a ZIP code or address.");
      return false;
    }

    setManualLocationLoading(true);
    setManualLocationError(null);

    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
      let resolvedLocation: { lat: number; lng: number } | null = null;

      if (googleApiKey) {
        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask": "places.location",
          },
          body: JSON.stringify({
            textQuery: trimmed,
            maxResultCount: 1,
            regionCode: "US",
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const place = json.places?.[0];
          if (place?.location?.latitude && place?.location?.longitude) {
            resolvedLocation = {
              lat: place.location.latitude,
              lng: place.location.longitude,
            };
          }
        }
      }

      if (!resolvedLocation) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(trimmed)}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const json = await response.json();
          const result = Array.isArray(json) ? json[0] : null;
          const lat = Number.parseFloat(result?.lat ?? "");
          const lng = Number.parseFloat(result?.lon ?? "");
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            resolvedLocation = { lat, lng };
          }
        }
      }

      if (!resolvedLocation) {
        setManualLocationError("Could not find that ZIP code or address.");
        return false;
      }

      setLocation(resolvedLocation);
      setPermissionState("granted");
      return true;
    } catch {
      setManualLocationError("Unable to look up that address right now.");
      return false;
    } finally {
      setManualLocationLoading(false);
    }
  }, []);

  const clearManualLocationError = useCallback(() => {
    setManualLocationError(null);
  }, []);

  // Try to get location automatically on mount (only once)
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    location,
    permissionState,
    requestLocation,
    resolveManualLocation,
    manualLocationLoading,
    manualLocationError,
    clearManualLocationError,
  };
}
