import type { TefillahKey } from "@/lib/types";
import { TEFILLAH_LABELS } from "@/lib/constants";

export function AppHeader({
  currentFilter,
  onFilterChange,
  onProfileClick,
  onZmanimClick,
  zmanSummary,
  userInitials,
}: {
  currentFilter: TefillahKey;
  onFilterChange: (key: TefillahKey) => void;
  onProfileClick: () => void;
  onZmanimClick: () => void;
  zmanSummary: { earliest: string; latest: string; hoursLeft: string };
  userInitials?: string;
}) {
  return (
    <header className="app-header">
      <div className="header-top">
        <h1 className="app-title">
          Minyan Now
        </h1>
        <button className="icon-btn" onClick={onProfileClick} aria-label="Profile">
          {userInitials || (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )}
        </button>
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
  );
}
