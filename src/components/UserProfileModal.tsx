import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { createInitials } from "@/lib/utils";
import { fetchProfileById } from "@/services/supabase/friends";

export function UserProfileModal({
  open,
  userId,
  onClose,
}: {
  open: boolean;
  userId: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [joinedCount, setJoinedCount] = useState(0);
  const [hostedCount, setHostedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) return;

    setLoading(true);
    fetchProfileById(userId).then((result) => {
      setProfile(result.profile);
      setJoinedCount(result.joinedCount);
      setHostedCount(result.hostedCount);
      setLoading(false);
    });
  }, [userId, open]);

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

        {loading ? (
          <div className="user-profile-loading">Loading...</div>
        ) : profile ? (
          <>
            <div className="profile-section">
              <div className="profile-avatar">{createInitials(profile.full_name)}</div>
              <div className="profile-info">
                <h3>{profile.full_name ?? "Unknown"}</h3>
                <div className="reliability-badge">
                  <span>&#9733;</span>
                  <span>{reliabilityPercent}% reliability</span>
                </div>
              </div>
            </div>

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
                <span className="stat-value">{profile.streak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
          </>
        ) : (
          <div className="user-profile-loading">Profile not found.</div>
        )}
      </div>
    </div>
  );
}
