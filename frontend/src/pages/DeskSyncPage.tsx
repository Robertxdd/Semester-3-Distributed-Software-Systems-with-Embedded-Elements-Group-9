import { useEffect, useState } from 'react';
import { bulkPreset, bulkSetHeight, fetchDesks } from '../api/desks';
import type { DeskState } from '../types';

const DeskSyncPage = () => {
  const [desks, setDesks] = useState<DeskState[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [mode, setMode] = useState<'preset' | 'height'>('preset');
  const [preset, setPreset] = useState('SITTING');
  const [height, setHeight] = useState(1000);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const data = await fetchDesks();
      setDesks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const apply = async () => {
    if (!selected.length) {
      setMessage('Select at least one desk.');
      return;
    }
    try {
      if (mode === 'height') {
        await bulkSetHeight(selected, height);
        setMessage(`Queued height ${height}mm for ${selected.length} desks.`);
      } else {
        await bulkPreset(selected, preset);
        setMessage(`Queued preset ${preset} for ${selected.length} desks.`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to apply bulk command.');
    }
  };

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Desk sync</h2>
            <p className="card-subtitle">Apply height or preset to many desks</p>
          </div>
          <button className="btn secondary" onClick={load}>
            Refresh list
          </button>
        </div>
        <div className="grid three">
          <label className="field">
            <span>Mode</span>
            <select className="select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value="preset">Preset</option>
              <option value="height">Height</option>
            </select>
          </label>
          {mode === 'preset' ? (
            <label className="field">
              <span>Preset</span>
              <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="SITTING">SITTING</option>
                <option value="STANDING">STANDING</option>
              </select>
            </label>
          ) : (
            <label className="field">
              <span>Height (mm)</span>
              <input
                className="input"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </label>
          )}
          <div className="field">
            <span>Action</span>
            <button className="btn" onClick={apply}>
              Apply to selected ({selected.length})
            </button>
          </div>
        </div>
        {message && <p className="muted" style={{ marginTop: 8 }}>{message}</p>}
        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Desk</th>
                <th>Location</th>
                <th>Height</th>
                <th>Posture</th>
              </tr>
            </thead>
            <tbody>
              {desks.map((desk) => (
                <tr key={desk.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(desk.id)}
                      onChange={() => toggleSelect(desk.id)}
                    />
                  </td>
                  <td>{desk.name}</td>
                  <td>
                    {desk.building || '—'}/{desk.floor || '—'}/{desk.zone || '—'}
                  </td>
                  <td>{desk.current_height || '—'} mm</td>
                  <td>{desk.posture || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DeskSyncPage;
