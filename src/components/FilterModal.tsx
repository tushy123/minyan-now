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
  const showOptions: { value: "all" | "space" | "set"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "set", label: "Official" },
    { value: "space", label: "Pop-up" },
  ];

  const sortOptions: { value: "closest" | "soonest" | "fullest" | "reliable"; label: string }[] = [
    { value: "closest", label: "Closest" },
    { value: "soonest", label: "Soonest" },
    { value: "fullest", label: "Most Full" },
    { value: "reliable", label: "Reliable" },
  ];

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
          <label>Show</label>
          <div className="filter-presets">
            {showOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`filter-preset-btn${filterType === opt.value ? " active" : ""}`}
                onClick={() => onFilterTypeChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Sort by</label>
          <div className="filter-presets">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`filter-preset-btn${sortBy === opt.value ? " active" : ""}`}
                onClick={() => onSortChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Max distance</label>
          <div className="filter-presets">
            {([1, 5, 10, 25, 50, Infinity] as number[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-preset-btn${maxDistance === value ? " active" : ""}`}
                onClick={() => onDistanceChange(value)}
              >
                {value === Infinity ? "Unlimited" : `${value} mi`}
              </button>
            ))}
          </div>
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
