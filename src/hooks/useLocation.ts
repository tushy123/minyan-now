import { useEffect, useState, useRef, useCallback } from "react";

export function useLocation(onError?: (message: string) => void) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");

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

  // Try to get location automatically on mount (only once)
  useEffect(() => {
    requestLocation();
  }, []); // Empty array - only run once on mount

  return { location, permissionState, requestLocation };
}
