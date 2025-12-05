import { useEffect, useMemo, useState } from 'react';
import { fetchHealthSummary } from '../api/user';
import type { HealthSummary } from '../types';
import { minutesToHours } from '../utils/date';

const MyHealthPage = () => {
  const [today, setToday] = useState<HealthSummary | null>(null);
  const [week, setWeek] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, w] = await Promise.all([fetchHealthSummary('today'), fetchHealthSummary('week')]);
      setToday(t);
      setWeek(w);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalToday = (today?.sitting_minutes || 0) + (today?.standing_minutes || 0);
  const standPctToday = totalToday ? Math.round(((today?.standing_minutes || 0) / totalToday) * 100) : 0;
  const weeklyStandingPct = useMemo(() => {
    if (!week?.per_day?.length) return 0;
    const totals = week.per_day.reduce(
      (acc, day) => {
        acc.stand += day.standing;
        acc.sit += day.sitting;
        return acc;
      },
      { sit: 0, stand: 0 }
    );
    const total = totals.sit + totals.stand || 1;
    return Math.round((totals.stand / total) * 100);
  }, [week]);
  const weeklyPostureChanges = useMemo(() => {
    if (!week?.per_day?.length) return 0;
    // Approximate movement from day-to-day mixes.
    const changes = week.per_day.map((day) => Math.max(1, Math.round((day.standing + day.sitting) / 60)));
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
    return Math.round(avg);
  }, [week]);
  const wellbeingScore = Math.max(
    20,
    Math.min(100, standPctToday * 0.5 + (weeklyStandingPct || standPctToday) * 0.3 + weeklyPostureChanges * 2)
  );

  if (loading) return <div>Loading health insights...</div>;

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Health summary</h2>
            <p className="card-subtitle">Daily + weekly standing vs sitting behaviour</p>
          </div>
          <button className="btn secondary" onClick={load}>
            Refresh
          </button>
        </div>
        {today ? (
          <div className="grid three">
            <div className="metric">
              <span className="label">Today sitting</span>
              <span className="value">{minutesToHours(today.sitting_minutes)}</span>
            </div>
            <div className="metric">
              <span className="label">Today standing</span>
              <span className="value">{minutesToHours(today.standing_minutes)}</span>
            </div>
            <div className="metric">
              <span className="label">Posture changes</span>
              <span className="value">{today.posture_changes}</span>
            </div>
          </div>
        ) : (
          <p className="muted">No data for today.</p>
        )}
        {week && (
          <div style={{ marginTop: 16 }}>
            <h4>Weekly trend</h4>
            <div className="stacked-bars">
              {week.per_day?.map((day) => {
                const total = day.sitting + day.standing || 1;
                const sitPercent = Math.round((day.sitting / total) * 100);
                const standPercent = 100 - sitPercent;
                return (
                  <div key={day.date}>
                    <div className="flex between">
                      <span className="muted">{day.date}</span>
                      <span className="muted">
                        {day.sitting}m sit / {day.standing}m stand
                      </span>
                    </div>
                    <div className="bar">
                      <span className="sitting" style={{ width: `${sitPercent}%` }} />
                      <span className="standing" style={{ width: `${standPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {today?.health_message && (
          <div className="banner" style={{ marginTop: 16 }}>
            <strong>Health feedback</strong>
            <p style={{ margin: '6px 0 0' }}>{today.health_message}</p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Well-being dashboards</h3>
            <p className="card-subtitle">Charts to visualise occupancy balance and movement.</p>
          </div>
          <button className="btn secondary" onClick={load}>
            Refresh charts
          </button>
        </div>

        <div className="grid two chart-grid">
          <div className="chart-tile">
            <div className="flex between" style={{ marginBottom: 8 }}>
              <div>
                <strong>Weekly mix</strong>
                <p className="muted" style={{ margin: '2px 0 0' }}>Standing vs sitting</p>
              </div>
              <span className="pill">{weeklyStandingPct}% standing</span>
            </div>
            <div
              className="donut"
              style={{
                background: `conic-gradient(#22c55e 0% ${weeklyStandingPct}%, #f97316 ${weeklyStandingPct}% 100%)`
              }}
            >
              <div className="donut-center">
                <strong>{weeklyStandingPct}%</strong>
                <span className="muted">weekly standing share</span>
              </div>
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="dot sitting" />
                <div>
                  <div>Sitting</div>
                  <div className="muted">{100 - weeklyStandingPct}%</div>
                </div>
              </div>
              <div className="legend-item">
                <span className="dot standing" />
                <div>
                  <div>Standing</div>
                  <div className="muted">{weeklyStandingPct}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-tile">
            <div className="flex between" style={{ marginBottom: 8 }}>
              <div>
                <strong>Weekly rhythm</strong>
                <p className="muted" style={{ margin: '2px 0 0' }}>Daily movement and balance</p>
              </div>
              <span className="pill">{weeklyPostureChanges} avg moves</span>
            </div>
            <div className="spark-bars compact">
              {week?.per_day?.map((day) => {
                const total = day.sitting + day.standing || 1;
                const standPercent = Math.round((day.standing / total) * 100);
                return (
                  <div key={day.date} className="bar">
                    <div
                      className="fill"
                      style={{ height: `${(standPercent / 100) * 100}%`, background: '#22c55e' }}
                      title={`${day.date} - ${standPercent}% standing`}
                    />
                    <span className="bar-label">{day.date}</span>
                  </div>
                );
              })}
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Taller bars mean a stronger standing share for that day.
            </p>
          </div>
        </div>

        <div className="grid three" style={{ marginTop: 12 }}>
          <div className="insight">
            <span className="label">Well-being score</span>
            <div className="value">{wellbeingScore}/100</div>
            <p className="muted">Blends posture balance and movement frequency.</p>
          </div>
          <div className="insight">
            <span className="label">Today standing share</span>
            <div className="value">{standPctToday}%</div>
            <p className="muted">Keep it near 40-60% for healthier flow.</p>
          </div>
          <div className="insight">
            <span className="label">Weekly posture shifts</span>
            <div className="value">{weeklyPostureChanges} avg</div>
            <p className="muted">Estimated changes per day across the week.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyHealthPage;
