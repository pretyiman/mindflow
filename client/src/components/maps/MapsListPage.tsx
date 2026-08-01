import { useState } from 'react';
import type { MindMap, MapRole } from '../../types/graph';

interface Props {
  maps: MindMap[];
  onOpenMap: (mapId: string) => void;
  onCreateMap: (name: string) => void;
  onDeleteMap: (mapId: string) => void;
  onShareMap: (mapId: string) => void;
}

const ROLE_LABEL: Record<MapRole, string> = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer'
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MapsListPage({ maps, onOpenMap, onCreateMap, onDeleteMap, onShareMap }: Props) {
  const [showNewMap, setShowNewMap] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newMapName.trim()) return;
    onCreateMap(newMapName.trim());
    setNewMapName('');
    setShowNewMap(false);
  };

  return (
    <div className="maps-page">
      <div className="maps-page-header">
        <h1>Your Maps</h1>
        <div className="inline-form">
          {showNewMap && (
            <input
              autoFocus
              placeholder="Map name"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          )}
          <button
            className="action-btn primary"
            onClick={() => (showNewMap ? handleCreate() : setShowNewMap(true))}
          >
            + New Map
          </button>
        </div>
      </div>

      {maps.length === 0 ? (
        <p className="hint-text maps-empty">No maps yet - create your first one above.</p>
      ) : (
        <div className="maps-list">
          {maps.map((m) => (
            <div key={m.id} className="map-row" onClick={() => onOpenMap(m.id)}>
              <div className="map-row-main">
                <span className="map-row-icon">🗺</span>
                <div>
                  <div className="map-row-name">{m.name}</div>
                  <div className="map-row-meta">Updated {formatDate(m.updatedAt)}</div>
                </div>
              </div>
              <div className="map-row-end" onClick={(e) => e.stopPropagation()}>
                <span className={`map-role-badge map-role-${m.myRole.toLowerCase()}`}>
                  {ROLE_LABEL[m.myRole]}
                </span>
                {m.myRole !== 'VIEWER' && (
                <div className="row-menu">
                  <button
                    className="icon-btn"
                    onClick={() => setOpenMenuId((id) => (id === m.id ? null : m.id))}
                    title="More actions"
                  >
                    ⋮
                  </button>
                  {openMenuId === m.id && (
                    <>
                      <div className="row-menu-scrim" onClick={() => setOpenMenuId(null)} />
                      <div className="row-menu-popover">
                        {m.myRole === 'OWNER' && (
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onShareMap(m.id);
                            }}
                          >
                            👥 Share
                          </button>
                        )}
                        {(m.myRole === 'OWNER' || m.myRole === 'EDITOR') && (
                          <button
                            className="danger"
                            onClick={() => {
                              setOpenMenuId(null);
                              if (window.confirm(`Delete "${m.name}"? This cannot be undone.`)) {
                                onDeleteMap(m.id);
                              }
                            }}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
