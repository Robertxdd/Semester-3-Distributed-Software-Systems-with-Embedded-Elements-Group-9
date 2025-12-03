import { useEffect, useState } from 'react';
import { fetchPresets, fetchReminders, updatePresets, updateReminders, updatePreferences } from '../api/user';
import type { Preset, ReminderSettings } from '../types';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const { theme, setTheme } = useTheme();

  const load = async () => {
    try {
      const [p, r] = await Promise.all([fetchPresets(), fetchReminders()]);
      setPresets(p);
      setReminders(r);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updatePresetHeight = (key: string, value: number) => {
    setPresets((prev) =>
      prev.map((p) => (p.key === key ? { ...p, height_mm: value } : p))
    );
  };

  const savePresets = async () => {
    setSaving(true);
    try {
      await updatePresets(presets);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveReminders = async () => {
    if (!reminders) return;
    setSaving(true);
    try {
      await updateReminders(reminders);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    try {
      await updatePreferences({ theme: value });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Presets</h2>
            <p className="card-subtitle">Edit standing and sitting heights</p>
          </div>
          <button className="btn secondary" onClick={savePresets} disabled={saving}>
            Save presets
          </button>
        </div>
        <div className="grid two">
          {['SITTING', 'STANDING'].map((key) => {
            const preset = presets.find((p) => p.key === key) || { key, height_mm: 0 };
            return (
              <label className="field" key={key}>
                <span>{key} height (mm)</span>
                <input
                  className="input"
                  type="number"
                  value={preset.height_mm}
                  onChange={(e) => updatePresetHeight(key, Number(e.target.value))}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Health reminders</h2>
            <p className="card-subtitle">Stay active with soft nudges</p>
          </div>
          <button className="btn secondary" onClick={saveReminders} disabled={saving}>
            Save reminders
          </button>
        </div>
        {reminders ? (
          <div className="grid two">
            <label className="field">
              <span>Enable reminders</span>
              <select
                className="select"
                value={reminders.enabled ? 'yes' : 'no'}
                onChange={(e) =>
                  setReminders({ ...reminders, enabled: e.target.value === 'yes' })
                }
              >
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
            </label>
            <label className="field">
              <span>Reminder type</span>
              <select
                className="select"
                value={reminders.type}
                onChange={(e) => setReminders({ ...reminders, type: e.target.value as ReminderSettings['type'] })}
              >
                <option value="TIME">Time-based</option>
                <option value="USAGE">Usage-based</option>
              </select>
            </label>
            {reminders.type === 'TIME' && (
              <label className="field">
                <span>Every X minutes</span>
                <input
                  className="input"
                  type="number"
                  value={reminders.every_minutes || 60}
                  onChange={(e) => setReminders({ ...reminders, every_minutes: Number(e.target.value) })}
                />
              </label>
            )}
            {reminders.type === 'USAGE' && (
              <label className="field">
                <span>Warn me if I sit more than (minutes)</span>
                <input
                  className="input"
                  type="number"
                  value={reminders.max_sitting_minutes || 90}
                  onChange={(e) => setReminders({ ...reminders, max_sitting_minutes: Number(e.target.value) })}
                />
              </label>
            )}
          </div>
        ) : (
          <p className="muted">Loading reminder settings...</p>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Theme</h2>
            <p className="card-subtitle">Light, dark or follow system preference</p>
          </div>
        </div>
        <div className="tabs">
          {['light', 'dark', 'system'].map((t) => (
            <button key={t} className={theme === t ? 'active' : ''} onClick={() => saveTheme(t as any)}>
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
