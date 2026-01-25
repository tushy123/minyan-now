"use client";

export type Alert = {
  id: string;
  type: "quorum" | "reminder" | "joined" | "message";
  title: string;
  message: string;
  time: Date;
  read: boolean;
  spaceId?: string;
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getAlertIcon(type: Alert["type"]) {
  switch (type) {
    case "quorum":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "reminder":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "joined":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    case "message":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}

export function AlertsPage({
  open,
  onClose,
  alerts,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  alerts: Alert[];
  onMarkAllRead: () => void;
}) {
  if (!open) return null;

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="alerts-page">
      <header className="alerts-header">
        <button className="back-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="alerts-title">
          Alerts
          {unreadCount > 0 && <span className="alerts-badge">{unreadCount}</span>}
        </h1>
        <button className="alerts-mark-read" onClick={onMarkAllRead} disabled={unreadCount === 0}>
          Mark all read
        </button>
      </header>

      <div className="alerts-content">
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <div className="alerts-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2>No alerts yet</h2>
            <p>You&apos;ll receive notifications when minyanim reach quorum or when it&apos;s time to pray.</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-item${alert.read ? "" : " unread"}`}
              >
                <div className={`alert-icon ${alert.type}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-title">{alert.title}</span>
                    <span className="alert-time">{formatTimeAgo(alert.time)}</span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="alerts-footer">
          <p>Notifications are stored locally on your device.</p>
        </div>
      </div>
    </div>
  );
}
