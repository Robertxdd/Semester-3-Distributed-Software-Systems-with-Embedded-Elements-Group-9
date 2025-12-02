import { useEffect, useState } from 'react';
import { fetchActiveDesk, fetchDesk, fetchTodayUsage, sendHeight, sendPreset } from '../api/desks';
import type { DeskState, UsageSummary } from '../types';
import { todayRange, formatDateTime } from '../utils/date';

const MyDeskPage = () => {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [heightInput, setHeightInput] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState('');

  const loadData = async () => {
    setLoading(true);
    setHint('');
    try {
      const active = await fetchActiveDesk();
      const deskId = active?.desk?.id || active.id;
      const fullDesk = active.desk || (await fetchDesk(deskId));
      setDesk(fullDesk);
      setHeightInput(fullDesk.current_height || 0);

      const { from, to } = todayRange();
      const todayUsage = await fetchTodayUsage(from, to);
      setUsage(todayUsage);
    } catch (err) {
      console.error(err);
      setHint('Failed to load desk data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePreset = async (preset: string) => {
    if (!desk) return;
    setHint('Sending command...');
    try {
      await sendPreset(desk.id, preset);
      setHint(`Moving to ${preset.toLowerCase()} height`);
    } catch (err) {
      console.error(err);
      setHint('Failed to send preset command.');
    }
  };

  const handleHeightSubmit = async () => {
    if (!desk) return;
    try {
      await sendHeight(desk.id, heightInput);
      setHint(`Setting height to ${heightInput} mm`);
    } catch (err) {
      console.error(err);
      setHint('Failed to set height');
    }
  };

  if (loading) return <div>Loading desk...</div>;
  if (!desk) return <div>No active desk assigned.</div>;

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{desk.name}</h2>
            <p className="card-subtitle">
              {desk.building || 'Unknown building'} · {desk.floor || 'Floor ?'} · {desk.zone || 'Zone ?'}
            </p>
          </div>
          <div className="status ok">Live</div>
        </div>
        <div className="grid three">
          <div className="metric">
            <span className="label">Current height</span>
            <span className="value">{desk.current_height ? `${desk.current_height} mm` : '—'}</span>
          </div>
          <div className="metric">
            <span className="label">Posture</span>
            <span className="value">{desk.posture || 'Unknown'}</span>
          </div>
          <div className="metric">
            <span className="label">Last updated</span>
            <span className="value">{formatDateTime(desk.updated_at)}</span>
          </div>
        </div>
        <div className="flex" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => handlePreset('SITTING')}>
            Go to Sitting
          </button>
          <button className="btn" onClick={() => handlePreset('STANDING')}>
            Go to Standing
          </button>
        </div>
        <div className="grid two" style={{ marginTop: 12 }}>
          <label className="field">
            <span>Pick height (mm)</span>
            <input
              className="input"
              type="number"
              value={heightInput}
              onChange={(e) => setHeightInput(Number(e.target.value))}
            />
            <input
              type="range"
              min={500}
              max={1300}
              value={heightInput}
              onChange={(e) => setHeightInput(Number(e.target.value))}
            />
          </label>
          <div className="flex" style={{ alignItems: 'flex-end', gap: 8 }}>
            <button className="btn secondary" onClick={handleHeightSubmit}>
              Set height
            </button>
            <button className="btn secondary" onClick={loadData}>
              Refresh
            </button>
          </div>
        </div>
        {hint && <p className="muted" style={{ marginTop: 8 }}>{hint}</p>}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Today</h3>
            <p className="card-subtitle">Sitting vs standing summary</p>
          </div>
        </div>
        {usage ? (
          <div className="grid three">
            <div className="metric">
              <span className="label">Sitting time</span>
              <span className="value">{usage.sitting_minutes} min</span>
            </div>
            <div className="metric">
              <span className="label">Standing time</span>
              <span className="value">{usage.standing_minutes} min</span>
            </div>
            <div className="metric">
              <span className="label">Posture changes</span>
              <span className="value">{usage.posture_changes}</span>
            </div>
          </div>
        ) : (
          <p className="muted">No usage data for today.</p>
        )}
      </section>
    </div>
  );
};

export default MyDeskPage;
