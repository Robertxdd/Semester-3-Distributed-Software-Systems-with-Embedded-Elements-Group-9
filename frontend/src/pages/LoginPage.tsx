import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LoginPage = () => {
  const { login, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      const profile = await login(email, password);
      const redirect = profile.role === 'OCCUPANT' ? '/desk' : '/desks';
      const from = (location.state as { from?: string })?.from;
      navigate(from || redirect, { replace: true });
    } catch {
      setLocalError('Could not sign in. Check your credentials.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>Welcome back</h1>
        <p>Log in to manage your adjustable desk.</p>
        <form className="grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {(error || localError) && <div className="banner danger">{error || localError}</div>}
          <div className="flex between">
            <button className="btn secondary" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              Toggle {theme === 'dark' ? 'light' : 'dark'} mode
            </button>
            <button className="btn" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
