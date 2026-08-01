import { useState } from 'react';
import { useAuthStore } from '../../state/authStore';
import { useThemeStore } from '../../state/themeStore';

interface Props {
  onOpenSettings: () => void;
}

export default function AccountBadge({ onOpenSettings }: Props) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="account-badge">
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
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
