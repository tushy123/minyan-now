export function ViewBar({
  view,
  onViewChange,
  onFilterClick,
}: {
  view: "list" | "map";
  onViewChange: (view: "list" | "map") => void;
  onFilterClick: () => void;
}) {
  return (
    <section className="view-bar">
      <div className="view-toggle">
        <button
          className={`view-btn${view === "list" ? " active" : ""}`}
          onClick={() => onViewChange("list")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          List
        </button>
        <button
          className={`view-btn${view === "map" ? " active" : ""}`}
          onClick={() => onViewChange("map")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Map
        </button>
      </div>
      <button className="filter-btn" onClick={onFilterClick} aria-label="Filter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
    </section>
  );
}
