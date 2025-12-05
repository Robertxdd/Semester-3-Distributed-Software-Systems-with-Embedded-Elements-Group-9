import { useEffect, useState } from 'react';
import { fetchActiveDesk, fetchDesk, fetchDesks, fetchTodayUsage, sendHeight, sendPreset } from '../api/desks';
import type { DeskState, UsageSummary } from '../types';
import { todayRange, formatDateTime } from '../utils/date';

const MyDeskPage = () => {
  const [desks, setDesks] = useState<DeskState[]>([]);
  const [selectedDeskId, setSelectedDeskId] = useState<number | null>(null);
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [heightInput, setHeightInput] = useState<number>(0);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDesk, setLoadingDesk] = useState(false);
  const [listHint, setListHint] = useState('');
  const [actionHint, setActionHint] = useState('');

  const loadDeskList = async () => {
    setLoadingList(true);
    setListHint('');
    try {
      const list = await fetchDesks();
      setDesks(list);
      return list;
    } catch (err) {
      console.error(err);
      setListHint('Failed to load desks list.');
      return [];
    } finally {
      setLoadingList(false);
    }
  };

  const loadDeskData = async (deskId: number) => {
    setLoadingDesk(true);
    setActionHint('');
    try {
      const fullDesk = await fetchDesk(deskId);
      setDesk(fullDesk);
      setHeightInput(fullDesk.current_height ?? fullDesk.target_height ?? 0);

      const { from, to } = todayRange();
      const todayUsage = await fetchTodayUsage(from, to, deskId);
      setUsage(todayUsage);
    } catch (err) {
      console.error(err);
      setActionHint('Failed to load desk data.');
    } finally {
      setLoadingDesk(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const list = await loadDeskList();
      let initialId: number | null = null;
      try {
        const active = await fetchActiveDesk();
        initialId = active?.desk?.id || active?.id || null;
      } catch (err) {
        console.info('Active desk not set', err);
      }
      if (!initialId && list.length) {
        initialId = list[0].id;
      }
      setSelectedDeskId(initialId);
      if (initialId) {
        loadDeskData(initialId);
      } else {
        setDesk(null);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDeskId) {
      loadDeskData(selectedDeskId);
    } else {
      setDesk(null);
      setUsage(null);
    }
  }, [selectedDeskId]);

  const handlePreset = async (preset: string) => {
    if (!desk) return;
    setActionHint('Sending command...');
    try {
      await sendPreset(desk.id, preset);
      setActionHint(`Moving to ${preset.toLowerCase()} height`);
    } catch (err) {
      console.error(err);
      setActionHint('Failed to send preset command.');
    }
  };

  const handleHeightSubmit = async () => {
    if (!desk) return;
    try {
      await sendHeight(desk.id, heightInput);
      setActionHint(`Setting height to ${heightInput} mm`);
    } catch (err) {
      console.error(err);
      setActionHint('Failed to set height');
    }
  };

  if (loadingList && !desks.length) return <div>Loading desks...</div>;

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Pick a desk</h2>
            <p className="card-subtitle">Choose which desk to control or create a new one.</p>
          </div>
          <button className="btn secondary" onClick={() => { loadDeskList(); if (selectedDeskId) loadDeskData(selectedDeskId); }}>
            Refresh list
          </button>
        </div>
        <div className="grid three">
          <label className="field">
            <span>Select desk</span>
            <select
              className="select"
              value={selectedDeskId ?? ''}
              disabled={loadingList}
              onChange={(e) => setSelectedDeskId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Choose a desk</option>
              {desks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || `Desk ${d.id}`}
                </option>
              ))}
            </select>
            <p className="helper">{loadingDesk ? 'Loading desk data...' : selectedDeskId ? '' : 'No desk selected.'}</p>
          </label>
          <label className="field">
            <span>Quick actions</span>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn secondary" onClick={() => selectedDeskId && loadDeskData(selectedDeskId)} disabled={!selectedDeskId || loadingDesk}>
                Refresh desk
              </button>
              <button className="btn secondary" onClick={() => loadDeskList()} disabled={loadingList}>
                Reload desks
              </button>
            </div>
          </label>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>{listHint || (desks.length ? `${desks.length} desks available` : 'No desks yet')}</p>
      </section>

      {desk ? (
        <>
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">{desk.name}</h2>
                <p className="card-subtitle">
                  {desk.building || 'Unknown building'} Aú {desk.floor || 'Floor ?'} Aú {desk.zone || 'Zone ?'}
                </p>
              </div>
              <div className="status ok">Live</div>
            </div>
            <div className="grid three">
              <div className="metric">
                <span className="label">Current height</span>
                <span className="value">{desk.current_height ? `${desk.current_height} mm` : 'ƒ?"'}</span>
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
                <button
                  className="btn secondary"
                  onClick={() => selectedDeskId && loadDeskData(selectedDeskId)}
                  disabled={!selectedDeskId || loadingDesk}
                >
                  Refresh
                </button>
              </div>
            </div>
            {actionHint && <p className="muted" style={{ marginTop: 8 }}>{actionHint}</p>}
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
        </>
      ) : (
        <section className="card">
          <p className="muted">Select or create a desk to see live controls.</p>
        </section>
      )}
    </div>
  );
};

export default MyDeskPage;
