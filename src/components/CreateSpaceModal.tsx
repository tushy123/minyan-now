import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import type { SpaceDraft, TefillahKey, ZmanWindow } from "@/lib/types";
import { formatTimeFromMinutes } from "@/lib/format";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import type { AddressSuggestion } from "@/hooks/useAddressAutocomplete";

export function CreateSpaceModal({
  open,
  draft,
  createError,
  createLoading,
  zmanWindow,
  zmanLabels,
  near,
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
  near?: { lat: number; lng: number };
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (value: SpaceDraft) => void;
}) {
  const { suggestions, loading: acLoading, search, clear } = useAddressAutocomplete(near);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLocationInput(value: string) {
    onDraftChange({ ...draft, location: value, lat: null, lng: null });
    search(value);
    setShowSuggestions(true);
  }

  function handleSelectSuggestion(suggestion: AddressSuggestion) {
    onDraftChange({
      ...draft,
      location: suggestion.formattedAddress,
      lat: suggestion.latitude,
      lng: suggestion.longitude,
    });
    setShowSuggestions(false);
    clear();
  }

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

          <div className="form-group" ref={wrapperRef}>
            <label htmlFor="location">Location</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                id="location"
                placeholder="Search for an address..."
                value={draft.location}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="autocomplete-suggestions">
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="autocomplete-item"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        {s.formattedAddress}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {acLoading && showSuggestions && (
                <div className="autocomplete-loading">
                  <small>Searching...</small>
                </div>
              )}
            </div>
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
