import { useMemo } from "react";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const toIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIso = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const mondayIndex = (date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const buildMatrix = (monthDate) => {
  const firstDay = startOfMonth(monthDate);
  const offset = mondayIndex(firstDay);
  const cursor = new Date(firstDay);
  cursor.setDate(cursor.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + index);
    return {
      date,
      iso: toIso(date),
      inMonth: date.getMonth() === monthDate.getMonth()
    };
  });
};

const monthLabel = (monthDate) =>
  monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export const MonthCalendar = ({
  monthDate,
  onMonthChange,
  selectedDate,
  onSelectDate,
  dayMeta = {},
  minDate,
  maxDate,
  compact = false
}) => {
  const calendarDays = useMemo(() => buildMatrix(monthDate), [monthDate]);
  const min = parseIso(minDate);
  const max = parseIso(maxDate);

  const handlePrev = () =>
    onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));

  const handleNext = () =>
    onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));

  const isOutOfRange = (date) => {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const defaultMeta = { state: "default", label: "", disabled: false, count: 0 };

  return (
    <div className={`month-calendar ${compact ? "is-compact" : ""}`}>
      <div className="month-calendar__header">
        <button type="button" className="ghost-action" onClick={handlePrev} aria-label="Mes anterior">
          {"<"}
        </button>
        <strong>{monthLabel(monthDate)}</strong>
        <button type="button" className="ghost-action" onClick={handleNext} aria-label="Proximo mes">
          {">"}
        </button>
      </div>

      <div className="month-calendar__weekdays" aria-hidden="true">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="month-calendar__grid">
        {calendarDays.map((item) => {
          const meta = dayMeta[item.iso] || defaultMeta;
          const disabled =
            !item.inMonth ||
            isOutOfRange(item.date) ||
            meta.disabled ||
            (!onSelectDate && meta.state !== "events");
          const isSelected = selectedDate === item.iso;

          return (
            <button
              key={item.iso}
              type="button"
              className={`day-cell ${item.inMonth ? "" : "is-out"} ${isSelected ? "is-selected" : ""} day-state-${meta.state || "default"}`}
              onClick={() => onSelectDate?.(item.iso)}
              disabled={disabled}
              title={meta.label || item.iso}
            >
              <span className="day-cell__number">{item.date.getDate()}</span>
              {meta.count ? <span className="day-cell__count">{meta.count}</span> : null}
              {meta.label ? <span className="day-cell__label">{meta.label}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const calendarUtils = {
  toIso,
  parseIso,
  startOfMonth,
  endOfMonth
};
