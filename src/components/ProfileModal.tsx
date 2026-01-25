import type { Profile } from "@/lib/types";
import { createInitials } from "@/lib/utils";

export function ProfileModal({
  open,
  profile,
  sessionEmail,
  joinedCount,
  hostedCount,
  onClose,
  onSignOut,
}: {
  open: boolean;
  profile: Profile | null;
  sessionEmail?: string | null;
  joinedCount: number;
  hostedCount: number;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const reliabilityPercent = profile ? Math.round(profile.reliability * 100) : 0;

  return (
    <div className={`modal${open ? " active" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Profile Header */}
        <div className="profile-section">
          <div className="profile-avatar">{createInitials(profile?.full_name)}</div>
          <div className="profile-info">
            <h3>{profile?.full_name ?? sessionEmail ?? "Guest"}</h3>
            <p>{sessionEmail}</p>
            {profile && (
              <div className="reliability-badge">
                <span>&#9733;</span>
                <span>{reliabilityPercent}% reliability</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-value">{joinedCount}</span>
            <span className="stat-label">Minyanim Joined</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{hostedCount}</span>
            <span className="stat-label">Spaces Hosted</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-value">{profile?.streak ?? 0}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>

        {/* Today's Davening */}
        <div>
          <h4 className="profile-section-title">Today&apos;s Status</h4>
          <div className="prayer-checklist">
            <label className="prayer-check">
              <input type="checkbox" />
              <span>Shacharis</span>
            </label>
            <label className="prayer-check">
              <input type="checkbox" />
              <span>Mincha</span>
            </label>
            <label className="prayer-check">
              <input type="checkbox" />
              <span>Maariv</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button className="btn btn-danger btn-block" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
