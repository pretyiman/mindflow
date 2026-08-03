import { useState } from 'react';
import { authApi } from '../../api/auth.api';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';

// Hard gate: an unverified account can log in (so it can reach this screen
// and request another email) but can't do anything else - every route that
// creates/edits content (maps, nodes, edges, ...) rejects it server-side
// regardless of what the client shows, this is just the matching UI so the
// restriction isn't a mystery.
export default function VerifyEmailGate() {
  const { user, logout } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await authApi.resendVerification();
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend the email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify your email</h1>
        <p className="hint-text">
          We sent a verification link to <strong>{user?.email}</strong>. Click it to unlock creating
          and editing maps.
        </p>

        {sent && <p className="success-text">Verification email sent - check your inbox.</p>}
        {error && <p className="error-text">{error}</p>}

        <button className="action-btn" onClick={handleResend} disabled={sending}>
          {sending ? 'Sending…' : 'Resend verification email'}
        </button>
        <button type="button" className="auth-switch" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
