import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { login, logout, resetPassword } from '@/services/adminService';

export default function Login() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (loading) return <div className="center-screen"><Spinner /></div>;
  if (user && isAdmin) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try {
      await login(email.trim(), password);
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!email.trim()) return setError('Enter your email first, then tap “Forgot password”.');
    try { await resetPassword(email.trim()); setError(''); setInfo('Password reset email sent.'); }
    catch { setError('Could not send the reset email.'); }
  };

  // Signed in but not listed as an admin yet: show the UID so it can be added in the console.
  if (user && !isAdmin) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <Logo />
          <h1>Almost there</h1>
          <p className="notice warn">You’re signed in as {user.email}, but this account isn’t an admin yet.</p>
          <p className="muted">In the Firebase console, open Firestore → create collection <b>admins</b> → add a document whose <b>Document ID</b> is this user ID (no fields needed):</p>
          <div className="uid-box">{user.uid}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>I’ve added it, check again</button>
          <button className="btn btn-ghost" onClick={() => logout()}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <Logo />
        <div><h1>Admin sign in</h1><p className="muted" style={{ marginTop: 6 }}>Manage the survey and see responses.</p></div>
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="error-text" role="alert">{error}</p>}
        {info && <p className="notice">{info}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>Forgot password</button>
      </form>
    </div>
  );
}
