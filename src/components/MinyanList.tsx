import type { UiItem, UiSpace } from "@/lib/types";
import { TEFILLAH_LABELS } from "@/lib/constants";
import { MiniMap } from "./MiniMap";

export function MinyanList({
  items,
  expandedId,
  joiningId,
  onExpand,
  onJoin,
  onDirections,
}: {
  items: UiItem[];
  expandedId: string | null;
  joiningId: string | null;
  onExpand: (item: UiItem) => void;
  onJoin: (space: UiSpace) => void;
  onDirections: (item: UiItem) => void;
}) {
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

              <div className="card-actions">
                {isOfficial ? (
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
                ) : isJoined ? (
                  <>
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
                      Directions
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={(event) => {
                        event.stopPropagation();
                        // Leave action would go here
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
