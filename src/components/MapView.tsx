"use client";

import { useEffect, useRef } from "react";
import type { UiItem } from "@/lib/types";
import { DEFAULT_CENTER, TEFILLAH_LABELS } from "@/lib/constants";

export function MapView({
  items,
  userLocation,
  isVisible,
  onSelect,
}: {
  items: UiItem[];
  userLocation: { lat: number; lng: number } | null;
  isVisible: boolean;
  onSelect: (item: UiItem) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const lastLocationRef = useRef<string | null>(null);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const center = userLocation ?? DEFAULT_CENTER;
    mapRef.current.setView([center.lat, center.lng], userLocation ? 15 : 13, {
      animate: true,
    });
  };

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const leafletModule = await import("leaflet");
      const L = (leafletModule as any).default ?? leafletModule;
      await import("leaflet.markercluster");

      if (cancelled || !mapContainerRef.current) return;

      if (!mapRef.current) {
        const initialCenter = userLocation ?? DEFAULT_CENTER;
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false, // We'll add custom zoom controls
        }).setView(
          [initialCenter.lat, initialCenter.lng],
          userLocation ? 15 : 13,
        );

        // CartoDB Dark Matter - free dark-themed tiles
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(mapRef.current);

        // Add zoom control to bottom left
        L.control.zoom({ position: "bottomleft" }).addTo(mapRef.current);

        const createCluster =
          (L as any).markerClusterGroup ??
          ((options: Record<string, unknown>) =>
            new (L as any).MarkerClusterGroup(options));

        markerLayerRef.current = createCluster({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div class="cluster-marker">${count}</div>`,
              className: "custom-cluster",
              iconSize: [40, 40],
            });
          },
        });
        mapRef.current.addLayer(markerLayerRef.current);
      }

      const cluster = markerLayerRef.current;
      if (!cluster) return;
      cluster.clearLayers();

      items.forEach((item) => {
        const isOfficial = item.type === "set";

        // Create custom marker HTML
        const markerHtml = `
          <div class="map-marker ${isOfficial ? "official" : "popup"}">
            <div class="marker-icon">
              ${isOfficial
                ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
              }
            </div>
            <div class="marker-pulse"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: "custom-marker-wrapper",
          html: markerHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = L.marker([item.lat, item.lng], { icon });

        // Create popup content
        const popupContent = `
          <div class="map-popup">
            <div class="popup-badge ${isOfficial ? "official" : "popup-type"}">${isOfficial ? "Official" : "Pop-up"}</div>
            <div class="popup-title">${TEFILLAH_LABELS[item.tefillah]} - ${item.startTime}</div>
            <div class="popup-subtitle">${isOfficial ? item.shulName : item.address}</div>
            <div class="popup-stats">
              <span class="popup-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${item.distanceLabel}
              </span>
              <span class="popup-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${item.etaLabel}
              </span>
            </div>
            <div class="popup-quorum">
              <div class="popup-quorum-bar">
                <div class="popup-quorum-fill" style="width: ${Math.min((item.members / item.capacity) * 100, 100)}%"></div>
              </div>
              <span class="popup-quorum-text">${item.members}/${item.capacity} for minyan</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: "custom-popup",
          closeButton: false,
          offset: [0, -20],
        });

        marker.on("click", () => {
          marker.openPopup();
        });

        marker.on("popupopen", () => {
          // Add click handler to popup
          setTimeout(() => {
            const popup = document.querySelector(".custom-popup .map-popup");
            if (popup) {
              popup.addEventListener("click", () => {
                onSelect(item);
                marker.closePopup();
              });
            }
          }, 0);
        });

        cluster.addLayer(marker);
      });

      // User location marker with pulse effect
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "user-marker-wrapper",
          html: `
            <div class="user-marker">
              <div class="user-marker-dot"></div>
              <div class="user-marker-pulse"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        } else {
          userMarkerRef.current = L.marker(
            [userLocation.lat, userLocation.lng],
            { icon: userIcon, zIndexOffset: 1000 },
          ).addTo(mapRef.current);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [items, userLocation, onSelect]);

  useEffect(() => {
    if (isVisible && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 150);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const key = `${userLocation.lat.toFixed(5)}:${userLocation.lng.toFixed(5)}`;
    if (lastLocationRef.current === key) return;
    lastLocationRef.current = key;
    mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
  }, [userLocation]);

  return (
    <div className="map-shell">
      <div ref={mapContainerRef} className="map-container" />
      <button
        type="button"
        className="map-recenter"
        onClick={(event) => {
          event.stopPropagation();
          handleRecenter();
        }}
        aria-label="Recenter map"
        disabled={!userLocation}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
      </button>
    </div>
  );
}
