import { useEffect, useState } from 'react';
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
    </div>
  );
};

export default MyHealthPage;
