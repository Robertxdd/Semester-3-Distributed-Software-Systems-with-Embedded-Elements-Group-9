import { useEffect, useState } from 'react';
import { fetchErrorReport, fetchUsageSummary, resolveError } from '../api/reports';
import type { DeskErrorItem, DeskReportRow } from '../types';
import { formatDateTime } from '../utils/date';

type Tab = 'errors' | 'usage';

const ReportsPage = () => {
  const [active, setActive] = useState<Tab>('errors');
  const [errors, setErrors] = useState<DeskErrorItem[]>([]);
  const [usage, setUsage] = useState<DeskReportRow[]>([]);
  const [filters, setFilters] = useState({ from: '', to: '', severity: '', deskId: '' });

  const loadErrors = async () => {
    try {
      const data = await fetchErrorReport({
        from: filters.from,
        to: filters.to,
        severity: filters.severity,
        deskId: filters.deskId ? Number(filters.deskId) : undefined
      });
      setErrors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await fetchUsageSummary({ groupBy: 'desk', from: filters.from, to: filters.to });
      setUsage(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadErrors();
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolve = async (id: number) => {
    try {
      await resolveError(id);
      loadErrors();
    } catch (err) {
      console.error(err);
    }
  };

  const unresolved = errors.filter((e) => !e.resolved_at).length;
  const topErrorDesks = errors
    .reduce<Record<number, number>>((acc, curr) => {
      const count = acc[curr.desk_id || 0] || 0;
      acc[curr.desk_id || 0] = count + 1;
      return acc;
    }, {});

  const topFive = Object.entries(topErrorDesks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Reports</h2>
            <p className="card-subtitle">Errors & maintenance · Usage & habits</p>
          </div>
        </div>
        <div className="tabs">
          <button className={active === 'errors' ? 'active' : ''} onClick={() => setActive('errors')}>
            Errors & Maintenance
          </button>
          <button className={active === 'usage' ? 'active' : ''} onClick={() => setActive('usage')}>
            Usage & Habits
          </button>
        </div>
      </section>

      <section className="card">
        <div className="grid four">
          <label className="field">
            <span>From</span>
            <input
              className="input"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              className="input"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Severity</span>
            <select
              className="select"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="field">
            <span>Desk ID</span>
            <input
              className="input"
              type="number"
              value={filters.deskId}
              onChange={(e) => setFilters({ ...filters, deskId: e.target.value })}
            />
          </label>
        </div>
        <div className="flex" style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={() => { loadErrors(); loadUsage(); }}>
            Apply filters
          </button>
          <span className="muted">Unresolved: {unresolved}</span>
        </div>
      </section>

      {active === 'errors' && (
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Error events</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Desk</th>
                  <th>Code</th>
                  <th>Message</th>
                  <th>Severity</th>
                  <th>Occurred</th>
                  <th>Resolved</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err) => (
                  <tr key={err.id}>
                    <td>{err.desk_id || '-'}</td>
                    <td>{err.code}</td>
                    <td>{err.message}</td>
                    <td>{err.severity}</td>
                    <td>{formatDateTime(err.occurred_at)}</td>
                    <td>{err.resolved_at ? formatDateTime(err.resolved_at) : 'Unresolved'}</td>
                    <td>
                      {!err.resolved_at && (
                        <button className="btn secondary" onClick={() => handleResolve(err.id)}>
                          Mark resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14 }}>
            <strong>Top desks with most errors</strong>
            <ul className="list">
              {topFive.map(([deskId, count]) => (
                <li key={deskId}>
                  Desk {deskId}: {count} errors
                </li>
              ))}
              {topFive.length === 0 && <li className="muted">No errors in range.</li>}
            </ul>
          </div>
        </section>
      )}

      {active === 'usage' && (
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Usage summary by desk</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Desk</th>
                  <th>Sitting minutes</th>
                  <th>Standing minutes</th>
                  <th>Posture changes</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.desk_id}>
                    <td>{row.desk_name || row.desk_id}</td>
                    <td>{row.sitting_minutes}</td>
                    <td>{row.standing_minutes}</td>
                    <td>{row.posture_changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div className="card" style={{ background: 'rgba(37,99,235,0.05)' }}>
              <strong>Most active desks</strong>
              <ul className="list">
                {[...usage]
                  .sort((a, b) => b.sitting_minutes + b.standing_minutes - (a.sitting_minutes + a.standing_minutes))
                  .slice(0, 5)
                  .map((row) => (
                    <li key={row.desk_id} className="flex between">
                      <span>{row.desk_name || `Desk ${row.desk_id}`}</span>
                      <span className="muted">
                        {row.sitting_minutes + row.standing_minutes} min total
                      </span>
                    </li>
                  ))}
                {usage.length === 0 && <li className="muted">No usage data.</li>}
              </ul>
            </div>
            <div className="card" style={{ background: 'rgba(16,185,129,0.05)' }}>
              <strong>Overall ratio</strong>
              <p className="muted">Pie approximation</p>
              {(() => {
                const totalSit = usage.reduce((sum, row) => sum + row.sitting_minutes, 0);
                const totalStand = usage.reduce((sum, row) => sum + row.standing_minutes, 0);
                const total = totalSit + totalStand || 1;
                const sitPct = Math.round((totalSit / total) * 100);
                const standPct = 100 - sitPct;
                return (
                  <div style={{ marginTop: 10 }}>
                    <div className="flex between">
                      <span>Sitting</span>
                      <span>{sitPct}%</span>
                    </div>
                    <div className="bar">
                      <span className="sitting" style={{ width: `${sitPct}%` }} />
                      <span className="standing" style={{ width: `${standPct}%` }} />
                    </div>
                    <div className="flex between" style={{ marginTop: 8 }}>
                      <span>Standing</span>
                      <span>{standPct}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ReportsPage;
