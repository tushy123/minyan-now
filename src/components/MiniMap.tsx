"use client";

import { useEffect, useRef } from "react";

export function MiniMap({
  lat,
  lng,
  isOfficial,
}: {
  lat: number;
  lng: number;
  isOfficial: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const leafletModule = await import("leaflet");
      const L = (leafletModule as any).default ?? leafletModule;

      if (cancelled || !containerRef.current) return;

      // Clean up existing map if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Create the map
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([lat, lng], 15);

      // CartoDB Dark Matter tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(mapRef.current);

      // Add marker
      const markerHtml = `
        <div class="map-marker ${isOfficial ? "official" : "popup"}">
          <div class="marker-icon">
            ${isOfficial
              ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
            }
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "custom-marker-wrapper",
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      L.marker([lat, lng], { icon }).addTo(mapRef.current);
    };

    void setup();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, isOfficial]);

  return <div ref={containerRef} className="mini-map" />;
}
