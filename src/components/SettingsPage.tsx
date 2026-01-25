"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";

type DistanceUnit = "miles" | "km";
type TimeFormat = "12h" | "24h";

export function SettingsPage({
  open,
  profile,
  sessionEmail,
  onClose,
  onSignOut,
  onSignIn,
}: {
  open: boolean;
  profile: Profile | null;
  sessionEmail?: string;
  onClose: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
}) {
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("miles");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
  const [notifyQuorum, setNotifyQuorum] = useState(true);
  const [notifyReminder, setNotifyReminder] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [newMinyanRadius, setNewMinyanRadius] = useState(5);
  const distanceOptions = distanceUnit === "miles" ? [1, 2, 5, 10, 20] : [2, 5, 10, 20, 30];

  if (!open) return null;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="back-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="settings-title">Settings</h1>
        <div style={{ width: 36 }} />
      </header>

      <div className="settings-content">
        {/* Account Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>

          {profile ? (
            <div className="settings-account">
              <div className="settings-account-avatar">
                {profile.full_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="settings-account-info">
                <span className="settings-account-name">{profile.full_name || "Anonymous"}</span>
                <span className="settings-account-email">{sessionEmail}</span>
                <div className="settings-account-stats">
                  <span className="settings-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {Math.round(profile.reliability * 100)}% reliable
                  </span>
                  <span className="settings-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    {profile.streak} day streak
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-sign-in-prompt">
              <p>Sign in to sync your preferences and track your minyan participation.</p>
              <button className="btn btn-primary" onClick={onSignIn}>
                Sign In
              </button>
            </div>
          )}
        </section>

        {/* Notifications Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Notifications</h2>

          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Full Minyan</span>
              <span className="settings-option-desc">Get notified when a minyan is complete</span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifyQuorum}
                onChange={(e) => setNotifyQuorum(e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>

          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Prayer Reminders</span>
              <span className="settings-option-desc">Remind me before minyan start time</span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifyReminder}
                onChange={(e) => setNotifyReminder(e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>

          {notifyReminder && (
            <div className="settings-option">
              <div className="settings-option-info">
                <span className="settings-option-label">Reminder Time</span>
                <span className="settings-option-desc">How early to remind you</span>
              </div>
              <select
                className="settings-select"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          )}

          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">New Minyan Radius</span>
              <span className="settings-option-desc">
                Notify me when a new minyan is created nearby if I haven&apos;t davened
              </span>
            </div>
            <select
              className="settings-select"
              value={newMinyanRadius}
              onChange={(e) => setNewMinyanRadius(Number(e.target.value))}
            >
              {distanceOptions.map((option) => (
                <option key={option} value={option}>
                  {option} {distanceUnit}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Display Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Display</h2>

          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Distance Unit</span>
            </div>
            <div className="settings-pills">
              <button
                className={`settings-pill${distanceUnit === "miles" ? " active" : ""}`}
                onClick={() => setDistanceUnit("miles")}
              >
                Miles
              </button>
              <button
                className={`settings-pill${distanceUnit === "km" ? " active" : ""}`}
                onClick={() => setDistanceUnit("km")}
              >
                Km
              </button>
            </div>
          </div>

          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Time Format</span>
            </div>
            <div className="settings-pills">
              <button
                className={`settings-pill${timeFormat === "12h" ? " active" : ""}`}
                onClick={() => setTimeFormat("12h")}
              >
                12h
              </button>
              <button
                className={`settings-pill${timeFormat === "24h" ? " active" : ""}`}
                onClick={() => setTimeFormat("24h")}
              >
                24h
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>

          <div className="settings-about-links">
            <button className="settings-link">
              <span>Privacy Policy</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button className="settings-link">
              <span>Terms of Service</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button className="settings-link">
              <span>Send Feedback</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="settings-version">
            <span>Minyan Now</span>
            <span className="settings-version-number">Version 1.0.0</span>
          </div>
        </section>

        {/* Sign Out */}
        {profile && (
          <section className="settings-section">
            <button className="btn btn-danger btn-block" onClick={onSignOut}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
