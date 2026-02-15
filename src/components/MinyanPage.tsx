import type { UiItem, UiSpace, UiSet } from "@/lib/types";
import type { SpaceMember } from "@/hooks/useSpaces";
import { TEFILLAH_LABELS } from "@/lib/constants";
import { createInitials } from "@/lib/utils";

export type ChatMessage = {
  sender: string;
  text: string;
  time: number;
};

export function MinyanPage({
  item,
  chatMessages,
  members,
  onClose,
  onSendChat,
  onDirections,
  onMemberTap,
}: {
  item: UiItem | null;
  chatMessages: ChatMessage[];
  members: SpaceMember[];
  onClose: () => void;
  onSendChat: (spaceId: string, text: string) => void;
  onDirections: (item: UiItem) => void;
  onMemberTap: (userId: string) => void;
}) {
  if (!item) {
    return <div className="minyan-page hidden"></div>;
  }

  const isSpace = item.type === "space";
  const spaceItem = isSpace ? (item as UiSpace) : null;
  const setItem = !isSpace ? (item as UiSet) : null;

  return (
    <div className="minyan-page">
      <div className="minyan-page-header">
        <button className="icon-btn" onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="minyan-page-title">
          {TEFILLAH_LABELS[item.tefillah]} - {item.startTime}
        </div>
      </div>
      <div className="minyan-page-content">
        <div className="minyan-page-card">
          <div className="minyan-page-subtitle">
            {isSpace ? `Hosted by ${spaceItem?.hostName}` : setItem?.shulName}
          </div>
          <div className="progress-track detail-progress">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((item.members / item.capacity) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="minyan-page-meta">
            {item.members}/{item.capacity} • {item.distanceLabel} - {item.etaLabel}
          </div>
          {!isSpace && setItem?.reliability && (
            <div className="minyan-page-meta">Reliability {setItem.reliability}%</div>
          )}
          {isSpace && spaceItem?.notes && (
            <div className="minyan-page-note">{spaceItem.notes}</div>
          )}
          <div className="minyan-page-map">
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
          <button className="btn btn-primary btn-block" onClick={() => onDirections(item)}>
            Get Directions
          </button>
        </div>

        {isSpace && members.length > 0 && (
          <div className="members-section">
            <div className="members-title">Members ({members.length})</div>
            <div className="members-list">
              {members.map((member) => (
                <button
                  key={member.userId}
                  className="member-item"
                  onClick={() => onMemberTap(member.userId)}
                >
                  <div className="member-avatar">{createInitials(member.fullName)}</div>
                  <span className="member-name">{member.fullName ?? "Anonymous"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSpace && (
          <div className="minyan-page-chat">
            <div className="chat-title">Minyan Chat</div>
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">No messages yet.</div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={`${message.time}-${index}`}
                    className={`chat-message${message.sender === "System" ? " system" : ""}`}
                  >
                    <span className="chat-sender">{message.sender}</span>
                    <span className="chat-text">{message.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                type="text"
                placeholder="Message the group"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const target = event.currentTarget;
                    onSendChat(item.id, target.value);
                    target.value = "";
                  }
                }}
              />
              <button
                className="btn btn-secondary chat-send"
                onClick={(event) => {
                  const input = event.currentTarget.parentElement?.querySelector(
                    ".chat-input",
                  ) as HTMLInputElement | null;
                  if (!input) return;
                  onSendChat(item.id, input.value);
                  input.value = "";
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
