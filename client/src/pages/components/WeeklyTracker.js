import React, { useMemo } from 'react';

// Helper to format YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toLocaleDateString('en-CA');
};

// Build a 7-day window for the current calendar week (Mon-Sun)
const useWeekDays = () => {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: formatDate(d),
        isToday: formatDate(d) === formatDate(today)
      });
    }
    return days;
  }, []);
};

// Compute a set of done dates based on streak and last completed date
const buildDoneSet = (currentStreak, lastCompletedDate) => {
  const set = new Set();
  if (!currentStreak || !lastCompletedDate) return set;
  const base = new Date(lastCompletedDate);
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < currentStreak; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    set.add(formatDate(d));
  }
  return set;
};

const WeeklyTracker = ({
  title = 'Weekly Progress',
  currentStreak = 0,
  lastCompletedDate = null,
  onMarkToday,
  isMarking = false,
  disabled = false,
  infoLabels = [] // optional labels for each weekday (Mon..Sun)
}) => {
  const weekDays = useWeekDays();
  const doneSet = useMemo(
    () => buildDoneSet(currentStreak, lastCompletedDate),
    [currentStreak, lastCompletedDate]
  );

  return (
    <div className="glass-box">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="week-grid">
        {weekDays.map((d, idx) => {
          const isDone = doneSet.has(d.dateStr);
          const isToday = d.isToday;
          const hint = infoLabels[idx] || '';
          return (
            <div
              key={d.dateStr}
              className={`day-card ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}`}
            >
              <div className="day-label">{d.label}</div>
              <div className="day-status">{isDone ? 'Done' : 'Pending'}</div>
              {hint && <div className="day-hint">{hint}</div>}
              {isToday && (
                <button
                  className="day-btn"
                  disabled={disabled || isDone || isMarking}
                  onClick={onMarkToday}
                >
                  {isDone ? 'Completed' : isMarking ? 'Marking…' : 'Mark Today'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyTracker;


