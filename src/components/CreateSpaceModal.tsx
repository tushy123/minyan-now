import type { FormEvent } from "react";
import type { SpaceDraft, TefillahKey, ZmanWindow } from "@/lib/types";
import { formatTimeFromMinutes } from "@/lib/format";

export function CreateSpaceModal({
  open,
  draft,
  createError,
  createLoading,
  zmanWindow,
  zmanLabels,
  onClose,
  onSubmit,
  onDraftChange,
}: {
  open: boolean;
  draft: SpaceDraft;
  createError: string | null;
  createLoading: boolean;
  zmanWindow: ZmanWindow;
  zmanLabels: { start: string; end: string };
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (value: SpaceDraft) => void;
}) {
  return (
    <div className={`modal${open ? " active" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create a Space</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <form className="space-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="tefillahType">Tefillah Type</label>
            <select
              id="tefillahType"
              value={draft.tefillah}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  tefillah: event.target.value as TefillahKey,
                })
              }
            >
              <option value="shacharis">Shacharis</option>
              <option value="mincha">Mincha</option>
              <option value="maariv">Maariv</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input
              type="range"
              id="startTime"
              min={zmanWindow.start}
              max={zmanWindow.end}
              step={5}
              value={draft.startMinutes}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  startMinutes: parseInt(event.target.value, 10),
                })
              }
            />
            <div className="range-value">{formatTimeFromMinutes(draft.startMinutes)}</div>
            <small className="zman-info">
              Earliest {zmanLabels.start} • Latest {zmanLabels.end}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              placeholder="Search address or drop pin on map"
              value={draft.location}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  location: event.target.value,
                })
              }
              required
            />
            <small>Tap map to set location</small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g., need baal koreh, Ashkenaz nusach"
              value={draft.notes}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  notes: event.target.value,
                })
              }
            ></textarea>
          </div>

          {createError && <div className="zman-info error">{createError}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? "Creating..." : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
