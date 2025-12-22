initThemeToggle();
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'index.html';
}

async function logout() {
  try {
    if (token) {
      await fetch('/api/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    }
  } catch (err) {
    console.warn('Logout failed', err);
  }
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}
document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', logout));

const BASE = '/api';
const DEFAULT_DESK_ID = 1;
let targetDeskId = null;

const els = {
  active: document.getElementById('kpi-active-desks'),
  balanced: document.getElementById('kpi-balanced'),
  maintenance: document.getElementById('kpi-maintenance'),
  energy: document.getElementById('kpi-energy'),
  healthScore: document.getElementById('health-score'),
  healthHelper: document.getElementById('health-helper'),
  stateBody: document.getElementById('state-history-body'),
  usageSummary: document.getElementById('usage-summary'),
  errorsList: document.getElementById('errors-list'),
  reportsSummary: document.getElementById('reports-summary'),
  donut: document.getElementById('hr-donut'),
  standPct: document.getElementById('hr-stand-pct'),
  standLegend: document.getElementById('hr-stand-pct-legend'),
  sitPct: document.getElementById('hr-sit-pct'),
  totalMin: document.getElementById('hr-total-min'),
  bars: document.getElementById('hr-bars'),
  events: document.getElementById('hr-events'),
  moves: document.getElementById('hr-moves'),
  score: document.getElementById('hr-score'),
  hint: document.getElementById('hr-hint'),
};

const authHeaders = () => {
  const authToken = localStorage.getItem('token');
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};

const requireAuth = async () => {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  if (!res.ok) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
    return null;
  }
  return res.json();
};

const safeNumber = (value) => (typeof value === 'number' ? value : 0);

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function updateKpisFromStats(stats) {
  const standing = safeNumber(stats?.standing_minutes);
  const sitting = safeNumber(stats?.sitting_minutes);
  const meets = !!stats?.meets_recommendation;

  els.balanced.textContent = `${standing}m standing / ${sitting}m sitting`;
  els.maintenance.textContent = safeNumber(stats?.errors_today);
  els.energy.textContent = meets ? 'On target' : 'Below target';
  els.healthScore.textContent = meets ? 'Health score: OK' : 'Health score: Needs attention';
  els.healthHelper.textContent = stats?.health_message || 'No message from backend.';
}

function renderStateHistory(items) {
  els.stateBody.innerHTML = '';
  if (!items.length) {
    els.stateBody.innerHTML = '<tr><td colspan="3">No history available.</td></tr>';
    return;
  }
  items.slice(-8).forEach(item => {
    const tr = document.createElement('tr');
    const cm = item.position_mm != null ? Math.round(item.position_mm / 10) : 'n/a';
    const when = item.collected_at || item.created_at || '';
    const flags = [];
    if (item.is_anti_collision) flags.push('anti-collision');
    if (item.is_overload_protection_up || item.is_overload_protection_down) flags.push('overload');
    const status = item.status || '?';
    const extra = flags.length ? ` [${flags.join(',')}]` : '';
    tr.innerHTML = `
      <td>${when}</td>
      <td>${cm}</td>
      <td>${status}${extra}</td>
    `;
    els.stateBody.appendChild(tr);
  });
}

function renderUsageSummary(summary) {
  els.usageSummary.textContent =
    `Activations delta: ${safeNumber(summary?.activations_delta)} | Sit/Stand delta: ${safeNumber(summary?.sit_stand_delta)}`;
}

function renderErrors(items) {
  els.errorsList.innerHTML = '';
  const errorItems = (items || []).filter(i =>
    i.is_anti_collision ||
    i.is_overload_protection_up ||
    i.is_overload_protection_down ||
    (i.status && i.status.toLowerCase().includes('error'))
  ).slice(-5);

  if (!errorItems.length) {
    els.errorsList.innerHTML = '<li>No recent errors reported.</li>';
    return;
  }

  errorItems.forEach(i => {
    const li = document.createElement('li');
    const when = i.collected_at || i.created_at || '';
    const codes = [];
    if (i.is_anti_collision) codes.push('anti-collision');
    if (i.is_overload_protection_up || i.is_overload_protection_down) codes.push('overload');
    const extra = codes.length ? ` [${codes.join(',')}]` : '';
    li.textContent = `${when} - ${i.status || 'Error'}${extra}`;
    els.errorsList.appendChild(li);
  });
}

function renderReport(stats, usage) {
  const standing = safeNumber(stats?.standing_minutes);
  const sitting = safeNumber(stats?.sitting_minutes);
  const moves = safeNumber(stats?.movements_today);
  const errors = safeNumber(stats?.errors_today);
  els.reportsSummary.textContent =
    `Desk ${stats.desk_id}: standing ${standing}m, sitting ${sitting}m, moves ${moves}, errors ${errors}. ` +
    `Activations delta ${safeNumber(usage?.activations_delta)}, sit/stand delta ${safeNumber(usage?.sit_stand_delta)}.`;
}

function updateDashboards(stats, history) {
  const standing = safeNumber(stats?.standing_minutes);
  const sitting = safeNumber(stats?.sitting_minutes);
  const moves = safeNumber(stats?.movements_today);
  const total = standing + sitting;
  const standPct = total ? Math.round((standing / total) * 100) : 0;
  const sitPct = 100 - standPct;

  els.donut.style.background = `conic-gradient(#22c55e 0% ${standPct}%, #f97316 ${standPct}% 100%)`;
  els.standPct.textContent = `${standPct}%`;
  els.standLegend.textContent = `${standPct}%`;
  els.sitPct.textContent = `${sitPct}%`;
  els.totalMin.textContent = `${total} min`;
  els.moves.textContent = `${moves} moves`;

  const buckets = Array.from({ length: 12 }, (_, i) => ({
    label: `${String(i * 2).padStart(2, '0')}:00`,
    count: 0
  }));
  (history || []).forEach(item => {
    const ts = item.collected_at || item.created_at;
    if (!ts) return;
    const hour = new Date(ts).getHours();
    const idx = Math.floor(hour / 2);
    if (buckets[idx]) buckets[idx].count += 1;
  });
  const maxCount = Math.max(1, ...buckets.map(b => b.count));
  els.bars.innerHTML = '';
  buckets.forEach(b => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.innerHTML = `
      <div class="fill" style="height:${(b.count / maxCount) * 100}%"></div>
      <span class="bar-label">${b.label}</span>
    `;
    els.bars.appendChild(bar);
  });
  els.events.textContent = `${(history || []).length} events`;

  const wellbeing = Math.max(20, Math.min(100, standPct * 0.6 + moves * 2.5));
  els.score.textContent = `${Math.round(wellbeing)}/100`;
  els.hint.textContent = standPct >= 40 && standPct <= 60
    ? 'Great balance today.'
    : 'Aim for ~50% standing and add a few extra posture changes.';
}

async function loadOverview() {
  try {
    const desks = await fetchJson(`${BASE}/desks`);
    els.active.textContent = desks.length;

    if (!desks.length) {
      els.balanced.textContent = '--';
      els.maintenance.textContent = '--';
      els.energy.textContent = '--';
      els.healthScore.textContent = 'Health score: --';
      els.healthHelper.textContent = 'No desks registered.';
      return;
    }

    const targetDesk = desks.find(d => d.id === DEFAULT_DESK_ID) || desks[0];
    targetDeskId = targetDesk.id;
    const stats = await fetchJson(`${BASE}/desks/${targetDeskId}/today-stats`);
    const history = await fetchJson(`${BASE}/desks/${targetDeskId}/state-history`);
    const usage = await fetchJson(`${BASE}/desks/${targetDeskId}/usage-summary`);

    updateKpisFromStats(stats);
    updateDashboards(stats, history);
    renderStateHistory(history);
    renderUsageSummary(usage);
    renderErrors(history);
    renderReport(stats, usage);
  } catch (err) {
    console.error('Failed to load health data', err);
    els.active.textContent = 'Error';
    els.balanced.textContent = 'Error';
    els.maintenance.textContent = 'Error';
    els.energy.textContent = 'Error';
    els.healthHelper.textContent = 'Could not load data from backend.';
  }
}

const init = async () => {
  const me = await requireAuth();
  if (!me) return;
  if (!me.is_admin) {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.remove());
  } else {
    document.querySelectorAll('[data-user-only]').forEach(el => el.remove());
  }
  const roleEl = document.getElementById('current-user-role');
  if (roleEl) {
    roleEl.textContent = me.is_admin ? 'Admin' : 'User';
  }
  loadOverview();
  setInterval(loadOverview, 60000);
};

init();
