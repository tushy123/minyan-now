import type { TefillahKey } from "@/lib/types";
import { TEFILLAH_LABELS } from "@/lib/constants";
import { CalendarModal } from "./CalendarModal";
import { useState } from "react";

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(12, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function AppHeader({
  currentFilter,
  onFilterChange,
  onProfileClick,
  onZmanimClick,
  zmanSummary,
  userInitials,
  selectedDate,
  onDateChange,
  isToday,
  onGoToToday,
  onlineCount,
}: {
  currentFilter: TefillahKey;
  onFilterChange: (key: TefillahKey) => void;
  onProfileClick: () => void;
  onZmanimClick: () => void;
  zmanSummary: { earliest: string; latest: string; hoursLeft: string };
  userInitials?: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isToday: boolean;
  onGoToToday: () => void;
  onlineCount: number;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePrevDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + 1);
    onDateChange(date.toISOString().slice(0, 10));
  };

  return (
    <>
    <header className="app-header">
      <div className="header-top">
        <div className="header-left">
          <h1 className="app-title">
            Minyan Now
          </h1>
          {onlineCount > 0 && (
            <div className="online-users-badge">
              <span className="online-dot" />
              {onlineCount} online
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onProfileClick} aria-label="Profile">
          {userInitials || (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )}
        </button>
      </div>

      <div className="date-nav-wrapper">
        {!isToday && (
          <button className="go-to-today-btn" onClick={onGoToToday}>
            Back to Today
          </button>
        )}
        <div className="date-nav">
          <button className="date-nav-btn" onClick={handlePrevDay} aria-label="Previous day">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="date-nav-label-btn"
            onClick={() => setCalendarOpen(true)}
            aria-label="Select date"
          >
            {formatDateLabel(selectedDate)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button className="date-nav-btn" onClick={handleNextDay} aria-label="Next day">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="prayer-tabs">
        {(Object.keys(TEFILLAH_LABELS) as TefillahKey[]).map((key) => (
          <button
            key={key}
            className={`filter-tab${currentFilter === key ? " active" : ""}`}
            onClick={() => onFilterChange(key)}
          >
            {TEFILLAH_LABELS[key]}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="zman-card zman-card-clickable"
        onClick={onZmanimClick}
        aria-label="View all zmanim"
      >
        <div className="zman-row">
          <div className="zman-item">
            <span className="zman-label">Earliest</span>
            <span className="zman-value">{zmanSummary.earliest}</span>
          </div>
          <div className="zman-item">
            <span className="zman-label">Latest</span>
            <span className="zman-value">{zmanSummary.latest}</span>
          </div>
          <div className="zman-item highlight">
            <span className="zman-label">Time Left</span>
            <span className="zman-value">{zmanSummary.hoursLeft}h</span>
          </div>
        </div>
        <div className="zman-card-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Tap for all zmanim</span>
        </div>
      </button>
    </header>

    <CalendarModal
      open={calendarOpen}
      selectedDate={selectedDate}
      onSelect={onDateChange}
      onClose={() => setCalendarOpen(false)}
    />
    </>
  );
}
