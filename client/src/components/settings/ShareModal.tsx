import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import {
  collaboratorsApi,
  type Collaborator,
  type CollaboratorRole,
  type PendingInvite
} from '../../api/collaborators.api';
import { invitesApi } from '../../api/invites.api';
import { ApiError } from '../../api/client';

interface Props {
  mapId: string;
  onClose: () => void;
}

function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

export default function ShareModal({ mapId, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('VIEWER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => {
    collaboratorsApi
      .list(mapId)
      .then((data) => {
        setCollaborators(data.collaborators);
        setPendingInvites(data.pendingInvites);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load collaborators'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [mapId]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      await collaboratorsApi.invite(mapId, { email: email.trim(), role });
      setEmail('');
      setError(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to invite collaborator');
    }
  };

  const handleRoleChange = async (id: string, nextRole: CollaboratorRole) => {
    try {
      await collaboratorsApi.updateRole(id, nextRole);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change role');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await collaboratorsApi.remove(id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove collaborator');
    }
  };

  const handleCopyLink = async (invite: PendingInvite) => {
    try {
      await navigator.clipboard.writeText(inviteLink(invite.token));
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId((id) => (id === invite.id ? null : id)), 2000);
    } catch {
      setError('Could not copy the link - your browser may be blocking clipboard access.');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await invitesApi.remove(id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to revoke invite');
    }
  };

  return (
    <Modal title="Share Map" onClose={onClose}>
      {!loading && collaborators.length === 0 && pendingInvites.length === 0 && (
        <p className="hint-text">
          Not shared with anyone yet. Invite by email below - they'll need to log in to accept,
          either from the email address or the link you can copy and send them directly.
        </p>
      )}

      {collaborators.length > 0 && (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {collaborators.map((c) => (
              <tr key={c.id}>
                <td>{c.user.name ?? c.user.email}</td>
                <td>
                  <select value={c.role} onChange={(e) => handleRoleChange(c.id, e.target.value as CollaboratorRole)}>
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => handleRemove(c.id)} title="Remove access">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pendingInvites.length > 0 && (
        <>
          <p className="hint-text" style={{ marginBottom: 8 }}>
            Pending - not yet accepted:
          </p>
          <table className="manage-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td>{inv.role === 'EDITOR' ? 'Editor' : 'Viewer'}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" onClick={() => handleCopyLink(inv)} title="Copy invite link">
                      {copiedId === inv.id ? '✓' : '🔗'}
                    </button>
                    <button className="icon-btn" onClick={() => handleRevokeInvite(inv.id)} title="Revoke invite">
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="add-form">
        <input
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as CollaboratorRole)}>
          <option value="VIEWER">Viewer</option>
          <option value="EDITOR">Editor</option>
        </select>
        <button className="action-btn" onClick={handleInvite}>
          + Invite
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
