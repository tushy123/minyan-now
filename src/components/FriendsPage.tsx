"use client";

import { useState, useCallback } from "react";
import type { Friendship, FriendRequest, Profile } from "@/lib/types";

type Tab = "friends" | "requests" | "search";

export function FriendsPage({
  open,
  friends,
  pendingRequests,
  sentRequests,
  minyanInvites,
  onClose,
  onAcceptRequest,
  onDeclineRequest,
  onUnfriend,
  onSearch,
  onSendRequest,
  onAcceptInvite,
  onDeclineInvite,
  onJoinSpace,
}: {
  open: boolean;
  friends: Friendship[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  minyanInvites: any[];
  onClose: () => void;
  onAcceptRequest: (requestId: string) => Promise<{ error: string | null }>;
  onDeclineRequest: (requestId: string) => Promise<{ error: string | null }>;
  onUnfriend: (friendId: string) => Promise<{ error: string | null }>;
  onSearch: (query: string) => Promise<{ data: Profile[]; error: string | null }>;
  onSendRequest: (userId: string) => Promise<{ error: string | null }>;
  onAcceptInvite: (inviteId: string) => Promise<{ error: string | null }>;
  onDeclineInvite: (inviteId: string) => Promise<{ error: string | null }>;
  onJoinSpace: (spaceId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const result = await onSearch(query);
    setSearchResults(result.data);
    setSearching(false);
  }, [onSearch]);

  const handleSendRequest = useCallback(async (userId: string) => {
    setActionLoading(userId);
    await onSendRequest(userId);
    setSearchResults(prev => prev.filter(u => u.id !== userId));
    setActionLoading(null);
  }, [onSendRequest]);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    setActionLoading(requestId);
    await onAcceptRequest(requestId);
    setActionLoading(null);
  }, [onAcceptRequest]);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    setActionLoading(requestId);
    await onDeclineRequest(requestId);
    setActionLoading(null);
  }, [onDeclineRequest]);

  const handleUnfriend = useCallback(async (friendId: string) => {
    setActionLoading(friendId);
    await onUnfriend(friendId);
    setActionLoading(null);
  }, [onUnfriend]);

  const handleAcceptInvite = useCallback(async (inviteId: string, spaceId: string) => {
    setActionLoading(inviteId);
    const result = await onAcceptInvite(inviteId);
    if (!result.error) {
      onJoinSpace(spaceId);
    }
    setActionLoading(null);
  }, [onAcceptInvite, onJoinSpace]);

  if (!open) return null;

  const totalRequests = pendingRequests.length + minyanInvites.length;

  return (
    <div className="friends-page">
      <header className="friends-header">
        <button className="back-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="friends-title">Friends</h1>
        <div style={{ width: 36 }} />
      </header>

      <nav className="friends-tabs">
        <button
          className={`friends-tab${activeTab === "friends" ? " active" : ""}`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
          {friends.length > 0 && <span className="tab-count">{friends.length}</span>}
        </button>
        <button
          className={`friends-tab${activeTab === "requests" ? " active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Requests
          {totalRequests > 0 && <span className="tab-count alert">{totalRequests}</span>}
        </button>
        <button
          className={`friends-tab${activeTab === "search" ? " active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Add
        </button>
      </nav>

      <div className="friends-content">
        {/* Friends List */}
        {activeTab === "friends" && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="friends-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h2>No friends yet</h2>
                <p>Search for people to add as friends</p>
                <button className="btn btn-primary" onClick={() => setActiveTab("search")}>
                  Find Friends
                </button>
              </div>
            ) : (
              friends.map((friendship) => (
                <div key={friendship.id} className="friend-item">
                  <div className="friend-avatar">
                    {friendship.friend?.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{friendship.friend?.full_name || "Unknown"}</span>
                    <span className="friend-reliability">
                      {Math.round((friendship.friend?.reliability || 0) * 100)}% reliable
                    </span>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleUnfriend(friendship.friend_id)}
                    disabled={actionLoading === friendship.friend_id}
                  >
                    {actionLoading === friendship.friend_id ? "..." : "Remove"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <div className="requests-list">
            {/* Minyan Invites */}
            {minyanInvites.length > 0 && (
              <div className="requests-section">
                <h3 className="requests-section-title">Minyan Invites</h3>
                {minyanInvites.map((invite) => (
                  <div key={invite.id} className="request-item invite">
                    <div className="request-avatar">
                      {invite.from_user?.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="request-info">
                      <span className="request-name">{invite.from_user?.full_name}</span>
                      <span className="request-detail">
                        Invited you to join a {invite.space?.tefillah?.toLowerCase()} minyan
                      </span>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAcceptInvite(invite.id, invite.space_id)}
                        disabled={actionLoading === invite.id}
                      >
                        Join
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onDeclineInvite(invite.id)}
                        disabled={actionLoading === invite.id}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="requests-section">
                <h3 className="requests-section-title">Friend Requests</h3>
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-avatar">
                      {request.from_user?.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="request-info">
                      <span className="request-name">{request.from_user?.full_name}</span>
                      <span className="request-detail">Wants to be your friend</span>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className="requests-section">
                <h3 className="requests-section-title">Sent Requests</h3>
                {sentRequests.map((request) => (
                  <div key={request.id} className="request-item sent">
                    <div className="request-avatar">
                      {request.to_user?.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="request-info">
                      <span className="request-name">{request.to_user?.full_name}</span>
                      <span className="request-detail">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalRequests === 0 && sentRequests.length === 0 && (
              <div className="friends-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <h2>No pending requests</h2>
                <p>Friend requests and minyan invites will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {activeTab === "search" && (
          <div className="search-section">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {searching && (
              <div className="search-loading">Searching...</div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div key={user.id} className="friend-item">
                    <div className="friend-avatar">
                      {user.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="friend-info">
                      <span className="friend-name">{user.full_name || "Unknown"}</span>
                      <span className="friend-reliability">
                        {Math.round(user.reliability * 100)}% reliable
                      </span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendRequest(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? "..." : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="search-empty">No users found</div>
            )}

            {searchQuery.length < 2 && (
              <div className="search-hint">Enter at least 2 characters to search</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
