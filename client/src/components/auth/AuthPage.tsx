import { useEffect, useRef, useState, type FormEvent } from 'react';
import { authApi } from '../../api/auth.api';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function AuthPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email, password })
          : await authApi.register({ email, password, name: name.trim() || undefined });
      setAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Google's identity script (index.html) loads async, so its readiness
  // can't be assumed on mount - poll briefly rather than relying on a single
  // check. Silently does nothing if no client ID is configured (Google
  // sign-in just isn't offered yet, not a broken page).
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !googleButtonRef.current) {
        setTimeout(tryInit, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setError(null);
          try {
            const result = await authApi.googleSignIn(response.credential);
            setAuth(result.token, result.user);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: mode === 'login' ? 'signin_with' : 'signup_with'
      });
    };
    tryInit();
    return () => {
      cancelled = true;
    };
    // Re-render the button when switching modes so its label ("Sign in"
    // vs "Sign up") stays accurate.
  }, [mode, setAuth]);

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Mindflow</h1>
        <p className="hint-text">{mode === 'login' ? 'Log in to your maps.' : 'Create an account to get started.'}</p>

        {mode === 'register' && (
          <div className="property">
            <label>Name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div className="property">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="property">
          <label>Password</label>
          <input
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="action-btn" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-divider">or</div>
            <div ref={googleButtonRef} className="google-signin-btn" />
          </>
        )}

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setError(null);
            setMode((m) => (m === 'login' ? 'register' : 'login'));
          }}
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
