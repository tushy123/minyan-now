export function FilterModal({
  open,
  filterType,
  sortBy,
  maxDistance,
  onClose,
  onReset,
  onFilterTypeChange,
  onSortChange,
  onDistanceChange,
}: {
  open: boolean;
  filterType: "all" | "space" | "set";
  sortBy: "closest" | "soonest" | "fullest" | "reliable";
  maxDistance: number;
  onClose: () => void;
  onReset: () => void;
  onFilterTypeChange: (value: "all" | "space" | "set") => void;
  onSortChange: (value: "closest" | "soonest" | "fullest" | "reliable") => void;
  onDistanceChange: (value: number) => void;
}) {
  return (
    <div className={`modal${open ? " active" : ""}`}>
      <div className="modal-content filter-modal">
        <div className="modal-header">
          <h2>Filter & Sort</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="form-group">
          <label htmlFor="filterType">Show</label>
          <select
            id="filterType"
            value={filterType}
            onChange={(event) => onFilterTypeChange(event.target.value as typeof filterType)}
          >
            <option value="all">All minyanim</option>
            <option value="set">Official minyanim only</option>
            <option value="space">Pop-up minyanim only</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sortBy">Sort by</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as typeof sortBy)}
          >
            <option value="closest">Closest</option>
            <option value="soonest">Soonest time</option>
            <option value="fullest">Most full</option>
            <option value="reliable">Most reliable</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="maxDistance">Max distance (miles)</label>
          <input
            type="range"
            id="maxDistance"
            min="0.1"
            max="2"
            step="0.1"
            value={maxDistance}
            onChange={(event) => onDistanceChange(parseFloat(event.target.value))}
          />
          <div className="range-value">{maxDistance.toFixed(1)} miles</div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
