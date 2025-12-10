import { useEffect, useMemo, useState } from 'react';
import {
  fetchDeskManagerReport,
  fetchDeskStateHistory,
  fetchDeskTodayStats,
  fetchDeskUsageDeltas,
  fetchDesks
} from '../api/desks';
import type {
  DeskDailyStats,
  DeskManagerReport,
  DeskState,
  DeskStateReading,
  DeskUsageDelta
} from '../types';
import { formatDateTime } from '../utils/date';

type Tab = 'usage' | 'errors';

const ReportsPage = () => {
  const [active, setActive] = useState<Tab>('usage');
  const [desks, setDesks] = useState<DeskState[]>([]);
  const [selectedDeskId, setSelectedDeskId] = useState<number | ''>('');
  const [stats, setStats] = useState<DeskDailyStats | null>(null);
  const [usage, setUsage] = useState<DeskUsageDelta | null>(null);
  const [history, setHistory] = useState<DeskStateReading[]>([]);
  const [report, setReport] = useState<DeskManagerReport | null>(null);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState('');

  const loadDesks = async () => {
    try {
      const data = await fetchDesks();
      setDesks(data);
      if (!selectedDeskId && data.length) {
        setSelectedDeskId(data[0].id);
        return data[0].id;
      }
    } catch (err) {
      console.error(err);
      setHint('No se pudo cargar la lista de escritorios.');
    }
    return typeof selectedDeskId === 'number' ? selectedDeskId : null;
  };

  const loadData = async (deskId?: number) => {
    const targetDeskId = deskId ?? (typeof selectedDeskId === 'number' ? selectedDeskId : null);
    if (!targetDeskId) {
      setHint('Selecciona un escritorio para ver los datos.');
      setStats(null);
      setUsage(null);
      setHistory([]);
      setReport(null);
      return;
    }

    setLoading(true);
    setHint('');
    try {
      const [statsData, usageData, historyData, reportData] = await Promise.all([
        fetchDeskTodayStats(targetDeskId),
        fetchDeskUsageDeltas(targetDeskId, { from: filters.from, to: filters.to }),
        fetchDeskStateHistory(targetDeskId, { from: filters.from, to: filters.to }),
        fetchDeskManagerReport(targetDeskId, { from: filters.from, to: filters.to })
      ]);
      setStats(statsData);
      setUsage(usageData);
      setHistory(historyData);
      setReport(reportData);
    } catch (err) {
      console.error(err);
      setHint('No se pudo cargar el informe de este escritorio.');
      setStats(null);
      setUsage(null);
      setHistory([]);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesks().then((id) => {
      if (id) loadData(id);
    });
  }, []);

  useEffect(() => {
    if (typeof selectedDeskId === 'number') {
      loadData(selectedDeskId);
    }
  }, [selectedDeskId]);

  const standingMinutes = stats?.standing_minutes ?? 0;
  const sittingMinutes = stats?.sitting_minutes ?? 0;
  const moves = stats?.movements_today ?? 0;
  const errorsToday = stats?.errors_today ?? 0;
  const totalMinutes = standingMinutes + sittingMinutes;
  const standingShare = totalMinutes ? Math.round((standingMinutes / totalMinutes) * 100) : 0;
  const sittingShare = totalMinutes ? 100 - standingShare : 0;
  const wellbeingScore = Math.max(20, Math.min(100, standingShare * 0.6 + moves * 3));

  const hourlyBuckets = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, idx) => ({
      label: `${String(idx * 2).padStart(2, '0')}:00`,
      count: 0
    }));
    history.forEach((item) => {
      const ts = item.collected_at || item.created_at;
      if (!ts) return;
      const hour = new Date(ts).getHours();
      const bucketIndex = Math.floor(hour / 2);
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count += 1;
      }
    });
    return buckets;
  }, [history]);
  const maxBucket = Math.max(1, ...hourlyBuckets.map((b) => b.count));
  const totalEvents = history.length;
  const improperCount = report?.improper_use?.length || 0;
  const breakdowns = report?.breakdowns || [];
  const usageDelta = usage || null;

  const selectedDeskLabel =
    typeof selectedDeskId === 'number'
      ? desks.find((d) => d.id === selectedDeskId)?.name || `Desk ${selectedDeskId}`
      : 'Desk';

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Health & Reports</h2>
            <p className="card-subtitle">Estado y habitos por escritorio (datos reales del backend)</p>
          </div>
          <div className="tabs">
            <button className={active === 'usage' ? 'active' : ''} onClick={() => setActive('usage')}>
              Uso & salud
            </button>
            <button className={active === 'errors' ? 'active' : ''} onClick={() => setActive('errors')}>
              Alertas & mantenimiento
            </button>
          </div>
        </div>

        <div className="grid four">
          <label className="field">
            <span>Desk</span>
            <select
              className="select"
              value={selectedDeskId}
              onChange={(e) => setSelectedDeskId(e.target.value ? Number(e.target.value) : '')}
              disabled={!desks.length}
            >
              <option value="">Selecciona un escritorio</option>
              {desks.map((desk) => (
                <option key={desk.id} value={desk.id}>
                  {desk.name || `Desk ${desk.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Desde</span>
            <input
              className="input"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input
              className="input"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <div className="field">
            <span>Acciones</span>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn secondary" onClick={() => loadDesks().then((id) => id && loadData(id))}>
                Recargar lista
              </button>
              <button className="btn" onClick={() => loadData()} disabled={loading}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          {hint || `${desks.length} escritorios totales${loading ? ' - cargando...' : ''}`}
        </p>
      </section>

      {active === 'usage' && (
        <>
          <section className="card">
            <div className="grid four">
              <div className="metric">
                <span className="label">Desk activo</span>
                <span className="value">{selectedDeskLabel}</span>
                <p className="muted">Desks disponibles: {desks.length}</p>
              </div>
              <div className="metric">
                <span className="label">Postura</span>
                <span className="value">
                  {standingMinutes}m stand / {sittingMinutes}m sit
                </span>
                <p className="muted">
                  Reparto {standingShare}% - {moves} movimientos
                </p>
              </div>
              <div className="metric">
                <span className="label">Contadores</span>
                <span className="value">
                  {usageDelta ? `${usageDelta.activations_delta} activaciones` : '--'}
                </span>
                <p className="muted">
                  Sit/stand delta {usageDelta ? usageDelta.sit_stand_delta : '--'}
                </p>
              </div>
              <div className="metric">
                <span className="label">Errores hoy</span>
                <span className="value">{errorsToday}</span>
                <p className="muted">{stats?.health_message || 'Sin mensaje de salud.'}</p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Dashboards de uso</h3>
              <p className="card-subtitle">Basado en /today-stats y /state-history.</p>
            </div>
            <div className="grid three chart-grid">
              <div className="chart-tile">
                <div className="flex between" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>Posture mix (hoy)</strong>
                    <p className="muted" style={{ margin: '2px 0 0' }}>
                      Standing vs sitting minutos
                    </p>
                  </div>
                  <span className="pill">{totalMinutes} min</span>
                </div>
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(#22c55e 0% ${standingShare}%, #f97316 ${standingShare}% 100%)`
                  }}
                >
                  <div className="donut-center">
                    <strong>{standingShare}%</strong>
                    <span className="muted">standing share</span>
                  </div>
                </div>
                <div className="legend">
                  <div className="legend-item">
                    <span className="dot sitting" />
                    <div>
                      <div>Sitting</div>
                      <div className="muted">{sittingShare}%</div>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="dot standing" />
                    <div>
                      <div>Standing</div>
                      <div className="muted">{standingShare}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-tile">
                <div className="flex between" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>Hourly occupancy</strong>
                    <p className="muted" style={{ margin: '2px 0 0' }}>
                      Lecturas agrupadas en ventanas de 2h
                    </p>
                  </div>
                  <span className="pill">{totalEvents} eventos</span>
                </div>
                <div className="spark-bars">
                  {hourlyBuckets.map((bucket) => (
                    <div key={bucket.label} className="bar">
                      <div
                        className="fill"
                        style={{ height: `${(bucket.count / maxBucket) * 100}%` }}
                        title={`${bucket.label} - ${bucket.count} lecturas`}
                      />
                      <span className="bar-label">{bucket.label}</span>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  Las barras muestran donde hubo actividad durante el dia.
                </p>
              </div>

              <div className="chart-tile">
                <div className="flex between" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>Well-being</strong>
                    <p className="muted" style={{ margin: '2px 0 0' }}>
                      Movimiento + equilibrio
                    </p>
                  </div>
                  <span className="pill">{moves} movimientos</span>
                </div>
                <div className="insight" style={{ boxShadow: 'none', background: 'transparent' }}>
                  <span className="label">Score</span>
                  <div className="value">{Math.round(wellbeingScore)}/100</div>
                  <p className="muted">Calculado con reparto de postura y cambios.</p>
                </div>
                <div className="insight" style={{ boxShadow: 'none', background: 'transparent' }}>
                  <span className="label">Hint</span>
                  <div className="value">{standingShare}% standing</div>
                  <p className="muted">
                    {standingShare >= 40 && standingShare <= 60
                      ? 'Buen equilibrio hoy.'
                      : 'Apunta a ~50% y anade mas cambios de postura.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Historial de estado</h3>
              <p className="card-subtitle">Ultimas lecturas registradas</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Cuando</th>
                    <th>Altura (mm)</th>
                    <th>Estado</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((entry, idx) => {
                    const flags = [] as string[];
                    if (entry.is_anti_collision) flags.push('anti-collision');
                    if (entry.is_overload_protection_up || entry.is_overload_protection_down) flags.push('overload');
                    if (entry.is_position_lost) flags.push('pos lost');
                    return (
                      <tr key={`${entry.collected_at || entry.created_at}-${idx}`}>
                        <td>{formatDateTime(entry.collected_at || entry.created_at)}</td>
                        <td>{entry.position_mm ?? 'n/a'}</td>
                        <td>{entry.status || '-'}</td>
                        <td>{flags.join(', ') || '-'}</td>
                      </tr>
                    );
                  })}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        Sin lecturas en este rango.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Informe generado</h3>
              {typeof selectedDeskId === 'number' && <span className="pill">Desk {selectedDeskId}</span>}
            </div>
            {stats && usageDelta ? (
              <p className="muted">
                Desk {stats.desk_id}: standing {standingMinutes}m, sitting {sittingMinutes}m, movimientos {moves},
                errores {errorsToday}. Activaciones delta {usageDelta.activations_delta}, sit/stand delta{' '}
                {usageDelta.sit_stand_delta}.
              </p>
            ) : (
              <p className="muted">{hint || 'Selecciona un escritorio y aplica filtros.'}</p>
            )}
          </section>
        </>
      )}

      {active === 'errors' && (
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Alertas recientes</h3>
            <p className="card-subtitle">Breakdowns e improper use desde /manager-report</p>
          </div>
          <div className="grid two">
            <div>
              <h4>Breakdowns</h4>
              <ul className="list">
                {breakdowns.length === 0 && <li className="muted">Sin errores registrados.</li>}
                {breakdowns.slice(0, 10).map((err, idx) => (
                  <li key={`${err.collected_at || err.created_at}-${err.error_code}-${idx}`}>
                    <strong>{err.error_code || 'Error'}</strong> - {formatDateTime(err.collected_at || err.created_at)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Improper use / flags</h4>
              <ul className="list">
                {improperCount === 0 && <li className="muted">Sin eventos destacados.</li>}
                {report?.improper_use?.slice(0, 10).map((item, idx) => (
                  <li key={`${item.collected_at || item.created_at}-${idx}`} className="flex between">
                    <span>{formatDateTime(item.collected_at || item.created_at)}</span>
                    <span className="muted">
                      {item.status || 'Flag'} {item.is_anti_collision ? '- anti-collision' : ''}
                      {item.is_overload_protection_up || item.is_overload_protection_down ? '- overload' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ReportsPage;
