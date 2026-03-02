"use client";

import { useState, useCallback } from "react";
import type { UiItem, UiSet, UiSpace, ShulSchedule, DayKey } from "@/lib/types";
import { TEFILLAH_LABELS } from "@/lib/constants";
import { MiniMap } from "./MiniMap";
import { fetchShulSchedules } from "@/services/supabase/shuls";

const DAY_SHORT: Record<DayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  shabbat: "Shabbat",
};

function formatDays(days: DayKey[]): string {
  if (days.length === 7) return "Daily";
  if (days.length === 5 && !days.includes("shabbat") && !days.includes("sun")) return "Mon\u2013Fri";
  if (days.length === 6 && !days.includes("shabbat")) return "Sun\u2013Fri";
  return days.map((d) => DAY_SHORT[d] ?? d).join(", ");
}

type ScheduleCache = Record<string, { loading: boolean; schedules: ShulSchedule[] }>;

export function MinyanList({
  items,
  expandedId,
  joiningId,
  onExpand,
  onJoin,
  onOpen,
  onLeave,
  onDirections,
}: {
  items: UiItem[];
  expandedId: string | null;
  joiningId: string | null;
  onExpand: (item: UiItem) => void;
  onJoin: (space: UiSpace) => void;
  onOpen: (item: UiItem) => void;
  onLeave: (spaceId: string) => void;
  onDirections: (item: UiItem) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [scheduleCache, setScheduleCache] = useState<ScheduleCache>({});

  const handleDetails = useCallback(
    async (item: UiSet) => {
      if (detailsOpen === item.id) {
        setDetailsOpen(null);
        return;
      }

      setDetailsOpen(item.id);

      if (!item.shul_id || scheduleCache[item.shul_id]) return;

      setScheduleCache((prev) => ({
        ...prev,
        [item.shul_id!]: { loading: true, schedules: [] },
      }));

      const schedules = await fetchShulSchedules(item.shul_id);

      setScheduleCache((prev) => ({
        ...prev,
        [item.shul_id!]: { loading: false, schedules },
      }));
    },
    [detailsOpen, scheduleCache]
  );

  if (items.length === 0) {
    return <p className="empty-state">No minyanim yet for this time. Try another tab.</p>;
  }

  return (
    <>
      {items.map((item, index) => {
        const isOfficial = item.type === "set";
        const isExpanded = item.id === expandedId;
        const isJoined = item.type === "space" && item.joined;
        const quorumPercent = Math.min((item.members / item.capacity) * 100, 100);
        const subtitle = isOfficial
          ? item.shulName
          : `Hosted by ${(item as UiSpace).hostName}`;
        const notes = !isOfficial && (item as UiSpace).notes ? (item as UiSpace).notes : "";
        const reliability = isOfficial && item.reliability;

        const hasShulId = isOfficial && !!(item as UiSet).shul_id;
        const isDetailsOpen = detailsOpen === item.id;
        const cached = hasShulId ? scheduleCache[(item as UiSet).shul_id!] : null;

        const cardClasses = [
          "minyan-card",
          index === 0 && "featured",
          isJoined && "joined",
          isExpanded && "expanded",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <article key={item.id} className={cardClasses} onClick={() => onExpand(item)}>
            {/* Top Row: Badge + Time */}
            <div className="card-top">
              <div className="card-badge-row">
                <span className={`badge ${isOfficial ? "badge-official" : "badge-pop"}`}>
                  {isOfficial ? "Official" : "Pop-up"}
                </span>
                {isJoined && <span className="badge badge-joined">Joined</span>}
              </div>
              <span className="card-time">{item.startTime}</span>
            </div>

            {/* Info Section */}
            <div className="card-info">
              <h3 className="card-title">{subtitle}</h3>
              <p className="card-location">{item.address}</p>
            </div>

            {/* Stats Row */}
            <div className="card-stats">
              <div className="card-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{item.distanceLabel}</span>
              </div>
              <div className="card-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{item.etaLabel}</span>
              </div>
            </div>

            {/* Quorum Progress */}
            <div className="quorum-display">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${quorumPercent}%` }} />
              </div>
              <div className="quorum-text">
                <span className="quorum-count">{item.members}/{item.capacity}</span>
                <span className="quorum-label">for minyan</span>
              </div>
            </div>

            {/* Expanded Content */}
            <div className="card-expand">
              {notes && (
                <div className="card-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{notes}</span>
                </div>
              )}

              {reliability && (
                <div className="reliability-display">
                  <span className="reliability-icon">&#9733;</span>
                  <span>{reliability}% reliable</span>
                </div>
              )}

              <div className="card-map">
                {isExpanded && (
                  <MiniMap lat={item.lat} lng={item.lng} isOfficial={isOfficial} />
                )}
              </div>

              {/* Inline Schedule (Details) */}
              {isDetailsOpen && hasShulId && (
                <div className="card-schedule">
                  {cached?.loading ? (
                    <p className="card-schedule-loading">Loading schedule...</p>
                  ) : cached?.schedules && cached.schedules.length > 0 ? (
                    (() => {
                      const grouped: Record<string, ShulSchedule[]> = {};
                      for (const s of cached.schedules) {
                        const key = s.tefillah;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(s);
                      }
                      const order = ["SHACHARIS", "MINCHA", "MAARIV"] as const;
                      return (
                        <>
                          <h4 className="card-schedule-title">Weekly Schedule</h4>
                          {order.map((tef) => {
                            const group = grouped[tef];
                            if (!group) return null;
                            const label = TEFILLAH_LABELS[tef.toLowerCase() as keyof typeof TEFILLAH_LABELS];
                            return (
                              <div key={tef} className="card-schedule-group">
                                <span className="card-schedule-tefillah">{label}</span>
                                {group.map((s) => (
                                  <div key={s.id} className="card-schedule-row">
                                    <span className="card-schedule-days">{formatDays(s.days)}</span>
                                    <span className="card-schedule-time">{s.start_time}</span>
                                    {s.name && <span className="card-schedule-name">{s.name}</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()
                  ) : (
                    <p className="card-schedule-empty">No schedule available.</p>
                  )}
                </div>
              )}

              <div className="card-actions">
                {isOfficial ? (
                  <>
                    {hasShulId && (
                      <button
                        className={`btn ${isDetailsOpen ? "btn-primary" : "btn-secondary"} btn-block`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDetails(item as UiSet);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {isDetailsOpen ? "Hide Details" : "Details"}
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDirections(item);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      Get Directions
                    </button>
                  </>
                ) : isJoined ? (
                  <>
                    <button
                      className="btn btn-primary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(item);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Open
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDirections(item);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      Directions
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onLeave(item.id);
                      }}
                    >
                      Leave
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onJoin(item as UiSpace);
                      }}
                      disabled={joiningId === item.id}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      {joiningId === item.id ? "Joining..." : "Join Minyan"}
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDirections(item);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      Directions
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}
