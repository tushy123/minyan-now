import type { AllZmanim } from "@/hooks/useZmanim";

type ZmanEntry = {
  key: keyof AllZmanim;
  label: string;
  hebrewLabel: string;
  category: "morning" | "midday" | "evening" | "night";
};

const ZMANIM_CONFIG: ZmanEntry[] = [
  { key: "alotHaShachar", label: "Dawn", hebrewLabel: "עלות השחר", category: "morning" },
  { key: "misheyakir", label: "Earliest Tallit/Tefillin", hebrewLabel: "משיכיר", category: "morning" },
  { key: "sunrise", label: "Sunrise", hebrewLabel: "הנץ החמה", category: "morning" },
  { key: "sofZmanShma", label: "Latest Shema", hebrewLabel: "סוף זמן ק״ש", category: "morning" },
  { key: "sofZmanTfilla", label: "Latest Shacharit", hebrewLabel: "סוף זמן תפילה", category: "morning" },
  { key: "chatzot", label: "Midday", hebrewLabel: "חצות היום", category: "midday" },
  { key: "minchaGedola", label: "Earliest Mincha", hebrewLabel: "מנחה גדולה", category: "midday" },
  { key: "minchaKetana", label: "Mincha Ketana", hebrewLabel: "מנחה קטנה", category: "midday" },
  { key: "plagHaMincha", label: "Plag HaMincha", hebrewLabel: "פלג המנחה", category: "evening" },
  { key: "sunset", label: "Sunset", hebrewLabel: "שקיעה", category: "evening" },
  { key: "beinHaShmashos", label: "Bein HaShmashos", hebrewLabel: "בין השמשות", category: "evening" },
  { key: "tzeit", label: "Nightfall", hebrewLabel: "צאת הכוכבים", category: "night" },
  { key: "chatzotNight", label: "Midnight", hebrewLabel: "חצות הלילה", category: "night" },
];

const CATEGORY_LABELS: Record<string, string> = {
  morning: "Morning",
  midday: "Midday",
  evening: "Evening",
  night: "Night",
};

export function ZmanimModal({
  open,
  allZmanim,
  onClose,
}: {
  open: boolean;
  allZmanim: AllZmanim;
  onClose: () => void;
}) {
  const hasAnyZmanim = Object.values(allZmanim).some((v) => v !== undefined);

  // Group zmanim by category
  const categories = ["morning", "midday", "evening", "night"] as const;

  return (
    <div className={`modal${open ? " active" : ""}`} onClick={onClose}>
      <div className="modal-content zmanim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Today&apos;s Zmanim</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!hasAnyZmanim ? (
          <div className="zmanim-empty">
            <p>Unable to load zmanim for your location.</p>
            <p className="zmanim-empty-hint">Make sure location access is enabled.</p>
          </div>
        ) : (
          <div className="zmanim-list">
            {categories.map((category) => {
              const items = ZMANIM_CONFIG.filter(
                (z) => z.category === category && allZmanim[z.key]
              );
              if (items.length === 0) return null;

              return (
                <div key={category} className="zmanim-category">
                  <h3 className="zmanim-category-title">{CATEGORY_LABELS[category]}</h3>
                  <div className="zmanim-items">
                    {items.map((zman) => (
                      <div key={zman.key} className="zmanim-item">
                        <div className="zmanim-item-labels">
                          <span className="zmanim-item-english">{zman.label}</span>
                          <span className="zmanim-item-hebrew">{zman.hebrewLabel}</span>
                        </div>
                        <span className="zmanim-item-time">{allZmanim[zman.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="zmanim-footer">
          <p>Times calculated for your current location</p>
          <p className="zmanim-source">Powered by Hebcal</p>
        </div>
      </div>
    </div>
  );
}
