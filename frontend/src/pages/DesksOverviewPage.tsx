import { useEffect, useState } from 'react';
import { fetchDesk, fetchDeskErrors, fetchDeskUsage, fetchDesks } from '../api/desks';
import type { DeskErrorItem, DeskState, DeskUsageEntry, FilterParams } from '../types';
import { formatDateTime } from '../utils/date';

const DesksOverviewPage = () => {
  const [desks, setDesks] = useState<DeskState[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({});
  const [selected, setSelected] = useState<DeskState | null>(null);
  const [usage, setUsage] = useState<DeskUsageEntry[]>([]);
  const [errors, setErrors] = useState<DeskErrorItem[]>([]);

  const loadDesks = async () => {
    setLoading(true);
    try {
      const data = await fetchDesks(filters);
      setDesks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDesk = async (deskId: number) => {
    try {
      const [deskData, deskUsage, deskErrors] = await Promise.all([
        fetchDesk(deskId),
        fetchDeskUsage(deskId),
        fetchDeskErrors(deskId)
      ]);
      setSelected(deskData);
      setUsage(deskUsage);
      setErrors(deskErrors);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDesks();
  }, []);

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Desks overview</h2>
            <p className="card-subtitle">Live status by building/floor/zone</p>
          </div>
          <div className="flex">
            <button className="btn secondary" onClick={loadDesks}>
              Refresh
            </button>
          </div>
        </div>
        <div className="grid four">
          <label className="field">
            <span>Building</span>
            <input
              className="input"
              value={filters.building || ''}
              onChange={(e) => setFilters({ ...filters, building: e.target.value })}
              placeholder="Any"
            />
          </label>
          <label className="field">
            <span>Floor</span>
            <input
              className="input"
              value={filters.floor || ''}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
              placeholder="Any"
            />
          </label>
          <label className="field">
            <span>Zone</span>
            <input
              className="input"
              value={filters.zone || ''}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
              placeholder="Any"
            />
          </label>
          <div className="field">
            <span>Flags</span>
            <div className="flex">
              <label>
                <input
                  type="checkbox"
                  checked={!!filters.only_errors}
                  onChange={(e) => setFilters({ ...filters, only_errors: e.target.checked })}
                />{' '}
                Only errors
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!filters.only_low_power}
                  onChange={(e) => setFilters({ ...filters, only_low_power: e.target.checked })}
                />{' '}
                Low power
              </label>
            </div>
          </div>
        </div>
        <div className="flex" style={{ marginTop: 8 }}>
          <button className="btn secondary" onClick={loadDesks} disabled={loading}>
            Apply filters
          </button>
          <span className="muted">{loading ? 'Loading...' : `${desks.length} desks`}</span>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Desk</th>
                <th>Location</th>
                <th>Height</th>
                <th>Posture</th>
                <th>Motor</th>
                <th>Last error</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {desks.map((desk) => (
                <tr key={desk.id} style={{ cursor: 'pointer' }} onClick={() => openDesk(desk.id)}>
                  <td>{desk.name}</td>
                  <td>
                    {desk.building || '—'}/{desk.floor || '—'}/{desk.zone || '—'}
                  </td>
                  <td>{desk.current_height ? `${desk.current_height} mm` : '—'}</td>
                  <td>{desk.posture || '—'}</td>
                  <td>{desk.motor_state || '—'}</td>
                  <td>{desk.last_error || 'None'}</td>
                  <td>{formatDateTime(desk.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Desk #{selected.id} detail</h3>
              <p className="card-subtitle">
                {selected.name} · {selected.building || '—'} / {selected.floor || '—'} / {selected.zone || '—'}
              </p>
            </div>
            <button className="btn secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className="grid three">
            <div className="metric">
              <span className="label">Current height</span>
              <span className="value">{selected.current_height ? `${selected.current_height} mm` : '—'}</span>
            </div>
            <div className="metric">
              <span className="label">Posture</span>
              <span className="value">{selected.posture || '—'}</span>
            </div>
            <div className="metric">
              <span className="label">Motor state</span>
              <span className="value">{selected.motor_state || '—'}</span>
            </div>
          </div>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div>
              <h4>Recent usage</h4>
              <ul className="list">
                {usage.slice(0, 6).map((u, idx) => (
                  <li key={idx} className="flex between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{u.posture}</span>
                    <span className="muted">
                      {u.duration_minutes} min · {formatDateTime(u.started_at)}
                    </span>
                  </li>
                ))}
                {usage.length === 0 && <li className="muted">No usage records.</li>}
              </ul>
            </div>
            <div>
              <h4>Recent errors</h4>
              <ul className="list">
                {errors.slice(0, 6).map((err) => (
                  <li key={err.id} className="flex between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>
                      {err.code} - {err.message}
                    </span>
                    <span className="muted">{err.severity}</span>
                  </li>
                ))}
                {errors.length === 0 && <li className="muted">No errors logged.</li>}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DesksOverviewPage;
