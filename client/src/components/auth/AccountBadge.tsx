import { useState } from 'react';
import { useAuthStore } from '../../state/authStore';

interface Props {
  onOpenSettings: () => void;
}

export default function AccountBadge({ onOpenSettings }: Props) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="account-badge">
      <button className="account-badge-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="account-avatar">{initial}</span>
        <span className="account-email">{user?.email}</span>
      </button>
      {open && (
        <>
          <div className="row-menu-scrim" onClick={() => setOpen(false)} />
          <div className="row-menu-popover account-menu-popover">
            <button
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
            >
              ⚙ Account Settings
            </button>
            <button onClick={logout}>⎋ Log out</button>
          </div>
        </>
      )}
    </div>
  );
}
