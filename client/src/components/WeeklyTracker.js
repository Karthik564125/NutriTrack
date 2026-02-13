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
    <div className="glass-box weekly-tracker-container" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{title}</h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Status: <strong>{infoLabels.length > 0 ? 'Active' : 'Tracking'}</strong>
        </div>
      </div>

      <div className="week-timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
        {weekDays.map((d, idx) => {
          const isDone = doneSet.has(d.dateStr);
          const isToday = d.isToday;
          const hint = infoLabels[idx] || ''; // e.g. "Leg Day"

          return (
            <div
              key={d.dateStr}
              className={`timeline-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '16px',
                background: isToday ? 'white' : 'transparent',
                border: isToday ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                opacity: (!isToday && !isDone) ? 0.7 : 1,
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, margin: '5px 0' }}>
                {new Date(d.dateStr).getDate()}
              </div>

              {/* Optional Hint/Label */}
              {hint && (
                <div style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-main)', margin: '5px 0', lineHeight: 1.2, height: '30px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {hint}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                {isDone ? (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                ) : isToday ? (
                  <button
                    className="day-mark-btn"
                    onClick={onMarkToday}
                    disabled={disabled || isDone || isMarking}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {isMarking ? '...' : '+'}
                  </button>
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyTracker;


