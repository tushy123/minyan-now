import { useState, useMemo } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarModal({
  open,
  selectedDate,
  onSelect,
  onClose,
}: {
  open: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const selected = useMemo(() => new Date(selectedDate + "T12:00:00"), [selectedDate]);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onSelect(dateStr);
    onClose();
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  if (!open) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="calendar-title">
            <span className="calendar-month">{MONTHS[viewMonth]}</span>
            <span className="calendar-year">{viewYear}</span>
          </div>
          <button className="calendar-nav-btn" onClick={handleNextMonth} aria-label="Next month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="calendar-weekdays">
          {DAYS.map((day) => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="calendar-day empty" />;
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            return (
              <button
                key={day}
                className={`calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                onClick={() => handleSelectDate(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="calendar-footer">
          <button className="btn btn-secondary" onClick={handleGoToToday}>
            Go to Today
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
