import { useEffect, useMemo, useState } from 'react';
import {
  fetchDesk,
  fetchDeskManagerReport,
  fetchDeskStateHistory,
  fetchDeskTodayStats,
  fetchDesks
} from '../api/desks';
import type { DeskManagerReport, DeskState, DeskStateReading, FilterParams } from '../types';
import { formatDateTime } from '../utils/date';

const DesksOverviewPage = () => {
  const [desks, setDesks] = useState<DeskState[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({});
  const [selected, setSelected] = useState<DeskState | null>(null);
  const [history, setHistory] = useState<DeskStateReading[]>([]);
  const [report, setReport] = useState<DeskManagerReport | null>(null);
  const [todayStats, setTodayStats] = useState<{ standing: number; sitting: number; moves: number; errors: number } | null>(null);
  const [detailHint, setDetailHint] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

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
    setLoadingDetail(true);
    setDetailHint('');
    try {
      const [deskData, stats, stateHistory, mgrReport] = await Promise.all([
        fetchDesk(deskId),
        fetchDeskTodayStats(deskId),
        fetchDeskStateHistory(deskId),
        fetchDeskManagerReport(deskId)
      ]);
      setSelected(deskData);
      setHistory(stateHistory);
      setReport(mgrReport);
      setTodayStats({
        standing: stats.standing_minutes ?? 0,
        sitting: stats.sitting_minutes ?? 0,
        moves: stats.movements_today ?? 0,
        errors: stats.errors_today ?? 0
      });
    } catch (err) {
      console.error(err);
      setDetailHint('No se pudo cargar el detalle del escritorio.');
      setSelected(null);
      setHistory([]);
      setReport(null);
      setTodayStats(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadDesks();
  }, []);

  const filteredDesks = useMemo(() => {
    const matchText = (value?: string | null, term?: string) => {
      if (!term) return true;
      return (value || '').toLowerCase().includes(term.toLowerCase());
    };
    return desks.filter((desk) => {
      const building = desk.location_building || desk.building || '';
      const floor = desk.location_floor || desk.floor || '';
      const zone = desk.location_zone || desk.zone || '';
      return matchText(building, filters.building) && matchText(floor, filters.floor) && matchText(zone, filters.zone);
    });
  }, [desks, filters]);

  const usageDelta = useMemo(() => {
    const startSitStand = report?.usage?.start_sitstand ?? 0;
    const endSitStand = report?.usage?.end_sitstand ?? 0;
    const startAct = report?.usage?.start_activations ?? 0;
    const endAct = report?.usage?.end_activations ?? 0;
    return {
      sitStand: endSitStand - startSitStand,
      activations: endAct - startAct
    };
  }, [report]);

  const locationLabel = (desk: DeskState) => {
    const parts = [desk.location_building || desk.building, desk.location_floor || desk.floor, desk.location_zone || desk.zone].filter(Boolean);
    return parts.length ? parts.join(' / ') : '—';
  };

  const heightLabel = (desk: DeskState) => {
    const value = desk.current_height ?? desk.height;
    return value != null ? `${value} mm` : '—';
  };

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
        <div className="grid three">
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
        </div>
        <div className="flex" style={{ marginTop: 8 }}>
          <button className="btn secondary" onClick={loadDesks} disabled={loading}>
            Refresh list
          </button>
          <span className="muted">
            {loading ? 'Loading...' : `${filteredDesks.length} desks filtered (source ${desks.length})`}
          </span>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Desk</th>
                <th>Location</th>
                <th>Height</th>
                <th>Posture/State</th>
                <th>Motor</th>
                <th>Last error</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredDesks.map((desk) => (
                <tr key={desk.id} style={{ cursor: 'pointer' }} onClick={() => openDesk(desk.id)}>
                  <td>{desk.name}</td>
                  <td>{locationLabel(desk)}</td>
                  <td>{heightLabel(desk)}</td>
                  <td>{desk.posture || desk.state || '—'}</td>
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
                {selected.name} | {locationLabel(selected)}
              </p>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn secondary" onClick={() => openDesk(selected.id)} disabled={loadingDetail}>
                {loadingDetail ? 'Loading...' : 'Refresh detail'}
              </button>
              <button className="btn secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="grid three">
            <div className="metric">
              <span className="label">Current height</span>
              <span className="value">{heightLabel(selected)}</span>
            </div>
            <div className="metric">
              <span className="label">State</span>
              <span className="value">{selected.state || selected.posture || '—'}</span>
            </div>
            <div className="metric">
              <span className="label">Motor state</span>
              <span className="value">{selected.motor_state || '—'}</span>
            </div>
          </div>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div className="card" style={{ background: 'rgba(37,99,235,0.05)' }}>
              <strong>Today stats</strong>
              {todayStats ? (
                <ul className="list">
                  <li className="flex between">
                    <span>Standing</span>
                    <span className="muted">{todayStats.standing} min</span>
                  </li>
                  <li className="flex between">
                    <span>Sitting</span>
                    <span className="muted">{todayStats.sitting} min</span>
                  </li>
                  <li className="flex between">
                    <span>Moves</span>
                    <span className="muted">{todayStats.moves}</span>
                  </li>
                  <li className="flex between">
                    <span>Errors</span>
                    <span className="muted">{todayStats.errors}</span>
                  </li>
                  <li className="flex between">
                    <span>Usage delta</span>
                    <span className="muted">{usageDelta.activations} activ / {usageDelta.sitStand} sit-stand</span>
                  </li>
                </ul>
              ) : (
                <p className="muted">{detailHint || 'No stats available.'}</p>
              )}
            </div>
            <div>
              <h4>Recent state readings</h4>
              <ul className="list">
                {history.slice(0, 6).map((entry, idx) => {
                  const flags: string[] = [];
                  if (entry.is_anti_collision) flags.push('anti-collision');
                  if (entry.is_overload_protection_up || entry.is_overload_protection_down) flags.push('overload');
                  if (entry.is_position_lost) flags.push('pos lost');
                  return (
                    <li
                      key={`${entry.collected_at || entry.created_at}-${idx}`}
                      className="flex between"
                      style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}
                    >
                      <span>{formatDateTime(entry.collected_at || entry.created_at)}</span>
                      <span className="muted">
                        {entry.position_mm ?? 'n/a'} mm {flags.length ? `| ${flags.join(', ')}` : ''}
                      </span>
                    </li>
                  );
                })}
                {history.length === 0 && <li className="muted">No readings in this range.</li>}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>Breakdowns / improper use</h4>
            <div className="grid two">
              <div>
                <strong>Breakdowns</strong>
                <ul className="list">
                  {report?.breakdowns?.slice(0, 6).map((item, idx) => (
                    <li key={`${item.collected_at || item.created_at}-${idx}`} className="flex between">
                      <span>{item.error_code || 'Error'}</span>
                      <span className="muted">{formatDateTime(item.collected_at || item.created_at)}</span>
                    </li>
                  ))}
                  {(!report?.breakdowns || report.breakdowns.length === 0) && (
                    <li className="muted">No breakdowns logged.</li>
                  )}
                </ul>
              </div>
              <div>
                <strong>Flags</strong>
                <ul className="list">
                  {report?.improper_use?.slice(0, 6).map((item, idx) => {
                    const flags: string[] = [];
                    if (item.is_anti_collision) flags.push('anti-collision');
                    if (item.is_overload_protection_up || item.is_overload_protection_down) flags.push('overload');
                    if (item.is_position_lost) flags.push('pos lost');
                    return (
                      <li key={`${item.collected_at || item.created_at}-${idx}`} className="flex between">
                        <span>{formatDateTime(item.collected_at || item.created_at)}</span>
                        <span className="muted">{flags.join(', ') || 'Flag'}</span>
                      </li>
                    );
                  })}
                  {(!report?.improper_use || report.improper_use.length === 0) && (
                    <li className="muted">No improper use flagged.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          {detailHint && <p className="muted" style={{ marginTop: 8 }}>{detailHint}</p>}
        </section>
      )}
    </div>
  );
};

export default DesksOverviewPage;
