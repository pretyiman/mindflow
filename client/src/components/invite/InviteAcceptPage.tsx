import { useEffect, useState } from 'react';
import { invitesApi, type InviteInfo } from '../../api/invites.api';
import { ApiError } from '../../api/client';

interface Props {
  token: string;
  onAccepted: (mapId: string) => void;
  onDismiss: () => void;
}

export default function InviteAcceptPage({ token, onAccepted, onDismiss }: Props) {
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    invitesApi
      .get(token)
      .then(setInvite)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'This invite link is not valid.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const result = await invitesApi.accept(token);
      onAccepted(result.mapId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept invite');
      setAccepting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Map Invite</h1>

        {loading && <p className="hint-text">Loading invite…</p>}

        {!loading && invite && !invite.accepted && (
          <>
            <p className="hint-text">
              You've been invited to <strong>{invite.mapName}</strong> as{' '}
              {invite.role === 'EDITOR' ? 'an Editor' : 'a Viewer'}.
            </p>
            <button className="action-btn" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Joining…' : 'Accept & Open Map'}
            </button>
          </>
        )}

        {!loading && invite?.accepted && (
          <>
            <p className="hint-text">This invite link has already been used.</p>
            <button className="action-btn" onClick={onDismiss}>
              Go to your maps
            </button>
          </>
        )}

        {!loading && error && (
          <>
            <p className="error-text">{error}</p>
            <button className="action-btn" onClick={onDismiss}>
              Go to your maps
            </button>
          </>
        )}
      </div>
    </div>
  );
}
