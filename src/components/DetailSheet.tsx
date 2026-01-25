import type { UiItem, UiSpace } from "@/lib/types";
import { TEFILLAH_LABELS } from "@/lib/constants";

export function DetailSheet({
  item,
  joiningId,
  onClose,
  onJoin,
  onDirections,
}: {
  item: UiItem | null;
  joiningId: string | null;
  onClose: () => void;
  onJoin: (space: UiSpace) => void;
  onDirections: (item: UiItem) => void;
}) {
  return (
    <div className={`bottom-sheet${item ? " active" : ""}`} onClick={onClose}>
      <div className="sheet-content" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle"></div>
        {item && (
          <div className="detail-card">
            <div className="detail-header-row">
              <span className={`badge ${item.type === "set" ? "badge-official" : "badge-pop"}`}>
                {item.type === "set" ? "Official" : "Pop Up"}
              </span>
              <span className="detail-main-title">
                {TEFILLAH_LABELS[item.tefillah]} - {item.startTime}
              </span>
            </div>
            <div className="detail-subline">
              {item.type === "set"
                ? item.shulName
                : `Hosted by ${(item as UiSpace).hostName}`}
            </div>
            <div className="progress-track detail-progress">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((item.members / item.capacity) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="detail-subline">
              {item.members}/{item.capacity} • {item.distanceLabel} - {item.etaLabel}
            </div>
            {item.type === "set" && item.reliability && (
              <div className="detail-note">Reliability {item.reliability}%</div>
            )}
            {item.type === "space" && (item as UiSpace).notes && (
              <div className="detail-note">{(item as UiSpace).notes}</div>
            )}
            <div className="detail-map">
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${item.lat},${item.lng}&zoom=14&size=640x320&maptype=mapnik&markers=${item.lat},${item.lng},red-pushpin`}
                alt="Map preview"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.style.display = "none";
                  target.parentElement?.classList.add("map-fallback");
                }}
              />
            </div>
            <div className="sheet-actions">
              {item.type === "space" ? (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => onJoin(item as UiSpace)}
                  disabled={joiningId === item.id}
                >
                  {joiningId === item.id ? "Joining..." : "Join Pop-up"}
                </button>
              ) : null}
              <button className="btn btn-secondary btn-block" onClick={() => onDirections(item)}>
                Get Directions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
