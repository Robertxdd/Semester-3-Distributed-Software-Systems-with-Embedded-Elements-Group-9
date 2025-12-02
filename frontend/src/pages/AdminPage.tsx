import { useEffect, useState } from 'react';
import { createUser, deleteUser, fetchSystemSettings, fetchUsers, updateSystemSettings, updateUserRole } from '../api/admin';
import type { User } from '../types';

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', role: 'OCCUPANT', password: '' });
  const [settings, setSettings] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([fetchUsers(), fetchSystemSettings().catch(() => ({}))]);
      setUsers(u);
      setSettings(s || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitUser = async () => {
    try {
      await createUser(form);
      setForm({ name: '', email: '', role: 'OCCUPANT', password: '' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const changeRole = async (id: number, role: string) => {
    await updateUserRole(id, role);
    load();
  };

  const removeUser = async (id: number) => {
    await deleteUser(id);
    load();
  };

  const saveSettings = async () => {
    try {
      await updateSystemSettings(settings);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Admin</h2>
            <p className="card-subtitle">User management and system settings</p>
          </div>
          <button className="btn secondary" onClick={load}>
            Refresh
          </button>
        </div>
        <div className="grid two">
          <label className="field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="OCCUPANT">OCCUPANT</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>
        <button className="btn" onClick={submitUser} disabled={loading}>
          Create user
        </button>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="card-title">Users</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="select" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      <option value="OCCUPANT">OCCUPANT</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn secondary danger" onClick={() => removeUser(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="card-title">System settings</h3>
          <button className="btn secondary" onClick={saveSettings}>
            Save settings
          </button>
        </div>
        {Object.keys(settings || {}).length === 0 && <p className="muted">No settings exposed by backend.</p>}
        <div className="grid two">
          {Object.entries(settings || {}).map(([key, value]) => (
            <label className="field" key={key}>
              <span>{key}</span>
              <input
                className="input"
                value={String(value)}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
