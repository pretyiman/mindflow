import { useEffect, useState } from 'react';
import { authApi } from '../../api/auth.api';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';

interface Props {
  token: string;
  onDone: () => void;
}

export default function VerifyEmailPage({ token, onDone }: Props) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [status, setStatus] = useState<'verifying' | 'done' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .verifyEmail(token)
      .then((user) => {
        updateUser(user);
        setStatus('done');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to verify this link.');
        setStatus('error');
      });
    // Only run once per token - updateUser is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Email Verification</h1>

        {status === 'verifying' && <p className="hint-text">Verifying your email…</p>}

        {status === 'done' && (
          <>
            <p className="success-text">Your email is verified. You're all set.</p>
            <button className="action-btn" onClick={onDone}>
              Continue to Mindflow
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="error-text">{error}</p>
            <button className="action-btn" onClick={onDone}>
              Continue to Mindflow
            </button>
          </>
        )}
      </div>
    </div>
  );
}
