"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { AuthMode, SpaceDraft, UiItem, UiSpace } from "@/lib/types";
import { DEFAULT_CENTER, TEFILLAH_TO_DB, ZMAN_WINDOWS } from "@/lib/constants";
import { dateFromMinutes } from "@/lib/format";
import { createInitials } from "@/lib/utils";
import { getCurrentTefillah } from "@/lib/getCurrentTefillah";
import { useAuth } from "@/hooks/useAuth";
import { useSpaces } from "@/hooks/useSpaces";
import { useLocation } from "@/hooks/useLocation";
import { useToasts } from "@/hooks/useToasts";
import { useZmanim } from "@/hooks/useZmanim";
import { useMinyanim } from "@/hooks/useMinyanim";
import { useModals, useSelection } from "@/hooks/useModals";
import { useShabbosMode } from "@/hooks/useShabbosMode";
import { useMessages } from "@/hooks/useMessages";
import { useTheme } from "@/hooks/useTheme";
import { useFriends } from "@/hooks/useFriends";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppHeader } from "@/components/AppHeader";
import { ViewBar } from "@/components/ViewBar";
import { MinyanList } from "@/components/MinyanList";
import { MapView } from "@/components/MapView";
import { DetailSheet } from "@/components/DetailSheet";
import { MinyanPage } from "@/components/MinyanPage";
import { CreateSpaceModal } from "@/components/CreateSpaceModal";
import { ProfileModal } from "@/components/ProfileModal";
import { FilterModal } from "@/components/FilterModal";
import { AuthModal } from "@/components/AuthModal";
import { ToastContainer } from "@/components/ToastContainer";
import { BottomNav, type NavTab } from "@/components/BottomNav";
import { ZmanimModal } from "@/components/ZmanimModal";
import { SettingsPage } from "@/components/SettingsPage";
import { AlertsPage, type Alert } from "@/components/AlertsPage";
import { FriendsPage } from "@/components/FriendsPage";

export default function Home() {
  // ==================== Core Hooks ====================
  const {
    session,
    profile,
    authLoading,
    authError,
    authStatus,
    setAuthError,
    setAuthStatus,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const {
    spaces,
    joinedSpaceIds,
    createNewSpace,
    joinExistingSpace,
    leaveExistingSpace,
  } = useSpaces(session?.user?.id);

  const { toasts, pushToast } = useToasts();
  const { location: userLocation, permissionState, requestLocation } = useLocation((message) => pushToast(message, "warning"));
  const origin = userLocation ?? DEFAULT_CENTER;

  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  const { windows: zmanWindows, labels: zmanLabels, allZmanim } = useZmanim(origin, selectedDate);
  const isShabbos = useShabbosMode();
  const { theme, setTheme } = useTheme();
  const { onlineCount } = useOnlineUsers(session?.user?.id);
  const {
    friends,
    pendingRequests,
    sentRequests,
    minyanInvites,
    pendingCount: friendRequestCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    unfriend,
    search: searchUsers,
    inviteToMinyan,
    acceptMinyanInvite,
    declineMinyanInvite,
  } = useFriends(session?.user?.id);
  const [showShabbosBanner, setShowShabbosBanner] = useState(false);

  // Auto-select the current tefillah based on time
  const autoTefillah = useMemo(() => getCurrentTefillah(zmanWindows), [zmanWindows]);

  // ==================== Minyan Filtering ====================
  const {
    sortedItems,
    hasJoinedSpace,
    currentFilter,
    filterType,
    sortBy,
    maxDistance,
    setCurrentFilter,
    setFilterType,
    setSortBy,
    setMaxDistance,
    resetFilters,
  } = useMinyanim({
    spaces,
    joinedSpaceIds,
    origin,
    initialTefillah: autoTefillah,
    selectedDate,
  });

  // ==================== Modal State ====================
  const { modals, openModal, closeModal } = useModals();
  const detailSheet = useSelection<UiItem>();
  const minyanPage = useSelection<UiItem>();

  // ==================== Chat (with real-time persistence) ====================
  const {
    messages: chatMessages,
    send: sendChatMessage,
  } = useMessages(
    minyanPage.selected?.type === "space" ? minyanPage.selected.id : null,
    session?.user?.id
  );

  // ==================== View State ====================
  const [view, setView] = useState<"list" | "map">("list");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const unreadAlertCount = useMemo(
    () => alerts.filter((alert) => !alert.read).length,
    [alerts]
  );
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  // ==================== Auth Form State ====================
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  // ==================== Create Space State ====================
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SpaceDraft>({
    tefillah: "mincha",
    startMinutes: ZMAN_WINDOWS.mincha.start,
    location: "",
    lat: null,
    lng: null,
    notes: "",
  });
  const handleMarkAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  }, []);

  // ==================== Effects ====================
  useEffect(() => {
    if (!isShabbos) {
      setShowShabbosBanner(false);
      return;
    }

    setShowShabbosBanner(true);
    const timeout = setTimeout(() => {
      setShowShabbosBanner(false);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [isShabbos]);

  // Close auth modal on successful login
  useEffect(() => {
    if (session?.user) {
      closeModal("auth");
      setAuthPassword("");
      setAuthError(null);
      setAuthStatus(null);
    }
  }, [session?.user, closeModal, setAuthError, setAuthStatus]);

  // Sync draft time with zman window
  useEffect(() => {
    const window = zmanWindows[draft.tefillah];
    if (draft.startMinutes < window.start || draft.startMinutes > window.end) {
      setDraft((prev) => ({ ...prev, startMinutes: window.start }));
    }
  }, [draft.tefillah, draft.startMinutes, zmanWindows]);

  // ==================== Computed Values ====================
  const zmanWindow = zmanWindows[currentFilter];
  const zmanLabel = zmanLabels[currentFilter];

  const zmanSummary = useMemo(() => {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const adjustedNow =
      zmanWindow.end > 24 * 60 - 1 && nowMinutes < zmanWindow.start
        ? nowMinutes + 24 * 60
        : nowMinutes;
    const minutesLeft = Math.max(0, zmanWindow.end - adjustedNow);
    return {
      earliest: zmanLabel.start,
      latest: zmanLabel.end,
      hoursLeft: (minutesLeft / 60).toFixed(2),
    };
  }, [zmanWindow.start, zmanWindow.end, zmanLabel.start, zmanLabel.end]);

  // ==================== Event Handlers ====================

  const handleAuthSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (authMode === "signUp") {
        await signUp(authName, authEmail, authPassword);
      } else {
        await signInWithPassword(authEmail, authPassword);
      }
    },
    [authMode, authName, authEmail, authPassword, signUp, signInWithPassword]
  );

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle(`${window.location.origin}/auth/callback`);
  }, [signInWithGoogle]);

  const handleCreateSpace = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!session?.user) {
        openModal("auth");
        pushToast("Sign in to create a space", "warning");
        return;
      }

      const window = zmanWindows[draft.tefillah];
      if (draft.startMinutes < window.start || draft.startMinutes > window.end) {
        setCreateError("Selected time is outside valid zmanim window.");
        return;
      }

      setCreateError(null);
      setCreateLoading(true);

      const startDate = dateFromMinutes(new Date(), draft.startMinutes);

      const result = await createNewSpace({
        tefillah: TEFILLAH_TO_DB[draft.tefillah],
        start_time: startDate.toISOString(),
        lat: draft.lat ?? userLocation?.lat ?? DEFAULT_CENTER.lat,
        lng: draft.lng ?? userLocation?.lng ?? DEFAULT_CENTER.lng,
        map_x: 50,
        map_y: 50,
        address: draft.location || null,
        notes: draft.notes || null,
        status: "OPEN",
        capacity: 10,
        quorum_count: 0,
        host_id: session.user.id,
        presence_rule: "Counts if on site or reliability >= 0.8 and ETA < 5 min.",
      });

      if (result.error || !result.data) {
        setCreateError(result.error ?? "Unable to create space.");
        setCreateLoading(false);
        return;
      }

      await joinExistingSpace(result.data.id);
      setCreateLoading(false);
      closeModal("create");
      setDraft((prev) => ({ ...prev, location: "", lat: null, lng: null, notes: "" }));
      pushToast("Space created successfully!", "success");
    },
    [
      session?.user,
      draft,
      zmanWindows,
      userLocation,
      createNewSpace,
      joinExistingSpace,
      openModal,
      closeModal,
      pushToast,
    ]
  );

  const handleJoinSpace = useCallback(
    async (space: UiSpace) => {
      if (!session?.user) {
        openModal("auth");
        pushToast("Sign in to join a space", "warning");
        return;
      }

      setJoiningId(space.id);
      const result = await joinExistingSpace(space.id);

      if (result.error && !result.duplicate) {
        pushToast(result.error, "error");
      } else {
        pushToast("Joined space! You will be notified as quorum fills.", "success");
        minyanPage.select(space);
      }

      setJoiningId(null);
    },
    [session?.user, joinExistingSpace, openModal, pushToast, minyanPage]
  );

  const handleLeaveSpace = useCallback(
    async (spaceId: string) => {
      const result = await leaveExistingSpace(spaceId);
      if (result.error) {
        pushToast(result.error, "error");
      } else {
        pushToast("Left the space.", "info");
        minyanPage.clear();
      }
    },
    [leaveExistingSpace, pushToast, minyanPage]
  );

  const handleExpandCard = useCallback((item: UiItem) => {
    setExpandedCardId((prev) => (prev === item.id ? null : item.id));
  }, []);

  const handleSendChat = useCallback(
    async (spaceId: string, text: string) => {
      if (!text.trim()) return;
      const result = await sendChatMessage(text);
      if (result.error) {
        pushToast(result.error, "error");
      }
    },
    [sendChatMessage, pushToast]
  );

  const handleDirections = useCallback((item: UiItem) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    closeModal("profile");
  }, [signOut, closeModal]);

  const handleProfileClick = useCallback(() => {
    if (session) {
      openModal("profile");
    } else {
      openModal("auth");
    }
  }, [session, openModal]);

  // ==================== Render ====================
  return (
    <ErrorBoundary>
      <div className={`app-shell${hasJoinedSpace ? " has-joined" : ""}`} id="app">
        <AppHeader
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onProfileClick={handleProfileClick}
          onZmanimClick={() => openModal("zmanim")}
          zmanSummary={zmanSummary}
          userInitials={session ? createInitials(profile?.full_name) : undefined}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isToday={selectedDate === new Date().toISOString().slice(0, 10)}
          onGoToToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
          onlineCount={onlineCount}
        />

        <ViewBar
          view={view}
          onViewChange={setView}
          onFilterClick={() => openModal("filter")}
        />

        <main className="main-content">
          <section className={`list-view${view === "list" ? "" : " hidden"}`}>
            <MinyanList
              items={sortedItems}
              expandedId={expandedCardId}
              joiningId={joiningId}
              onExpand={handleExpandCard}
              onJoin={handleJoinSpace}
              onDirections={handleDirections}
            />
          </section>

          <section className={`map-view${view === "map" ? "" : " hidden"}`}>
            <MapView
              items={sortedItems}
              userLocation={userLocation}
              isVisible={view === "map"}
              onSelect={detailSheet.select}
            />
          </section>
        </main>

        <div className="bottom-actions">
          <button className="action-btn" onClick={() => openModal("create")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Pop-up Minyan
          </button>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={unreadAlertCount}
          friendRequestCount={friendRequestCount}
        />

        <SettingsPage
          open={activeTab === "settings"}
          profile={profile}
          sessionEmail={session?.user?.email}
          onClose={() => setActiveTab("home")}
          onSignOut={handleSignOut}
          onSignIn={() => openModal("auth")}
          theme={theme}
          onThemeChange={setTheme}
        />

        <AlertsPage
          open={activeTab === "alerts"}
          onClose={() => setActiveTab("home")}
          alerts={alerts}
          onMarkAllRead={handleMarkAllAlertsRead}
        />

        <FriendsPage
          open={activeTab === "friends"}
          friends={friends}
          pendingRequests={pendingRequests}
          sentRequests={sentRequests}
          minyanInvites={minyanInvites}
          onClose={() => setActiveTab("home")}
          onAcceptRequest={acceptRequest}
          onDeclineRequest={declineRequest}
          onUnfriend={unfriend}
          onSearch={searchUsers}
          onSendRequest={sendRequest}
          onAcceptInvite={acceptMinyanInvite}
          onDeclineInvite={declineMinyanInvite}
          onJoinSpace={(spaceId) => {
            const space = spaces.find(s => s.id === spaceId);
            if (space) {
              handleJoinSpace(space as unknown as UiSpace);
            }
          }}
        />

        <MinyanPage
          item={minyanPage.selected}
          chatMessages={chatMessages.map((m) => ({
            sender: m.senderName,
            text: m.text,
            time: new Date(m.createdAt).getTime(),
          }))}
          onClose={minyanPage.clear}
          onSendChat={handleSendChat}
          onDirections={handleDirections}
        />

        <DetailSheet
          item={detailSheet.selected}
          joiningId={joiningId}
          onClose={detailSheet.clear}
          onJoin={handleJoinSpace}
          onDirections={handleDirections}
        />

        <CreateSpaceModal
          open={modals.create}
          draft={draft}
          createError={createError}
          createLoading={createLoading}
          zmanWindow={zmanWindows[draft.tefillah]}
          zmanLabels={zmanLabels[draft.tefillah]}
          near={userLocation ?? undefined}
          onClose={() => closeModal("create")}
          onSubmit={handleCreateSpace}
          onDraftChange={setDraft}
        />

        <ProfileModal
          open={modals.profile}
          profile={profile}
          sessionEmail={session?.user?.email}
          joinedCount={joinedSpaceIds.length}
          hostedCount={spaces.filter((space) => space.host_id === profile?.id).length}
          onClose={() => closeModal("profile")}
          onSignOut={handleSignOut}
        />

        <FilterModal
          open={modals.filter}
          filterType={filterType}
          sortBy={sortBy}
          maxDistance={maxDistance}
          onClose={() => closeModal("filter")}
          onReset={resetFilters}
          onFilterTypeChange={setFilterType}
          onSortChange={setSortBy}
          onDistanceChange={setMaxDistance}
        />

        <AuthModal
          open={modals.auth}
          mode={authMode}
          email={authEmail}
          password={authPassword}
          name={authName}
          loading={authLoading}
          error={authError}
          status={authStatus}
          onClose={() => closeModal("auth")}
          onModeChange={setAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onNameChange={setAuthName}
          onSubmit={handleAuthSubmit}
          onGoogle={handleGoogleSignIn}
        />

        <ZmanimModal
          open={modals.zmanim}
          allZmanim={allZmanim}
          onClose={() => closeModal("zmanim")}
        />

        {showShabbosBanner && (
          <div className="shabbos-banner" id="shabbosBanner">
            <span className="banner-icon">🕯️</span>
            <span>Shabbos Mode: Planning only - Real-time features disabled</span>
          </div>
        )}

        {!userLocation && permissionState !== "granted" && (
          <div className="location-banner">
            <div className="location-banner-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Enable location to see nearby minyanim</span>
            </div>
            <button
              className="location-banner-btn"
              onClick={(e) => {
                e.stopPropagation();
                requestLocation();
              }}
            >
              Enable
            </button>
          </div>
        )}

        <ToastContainer toasts={toasts} />
      </div>
    </ErrorBoundary>
  );
}
