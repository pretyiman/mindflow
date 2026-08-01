import { useState } from 'react';
import type { GraphData, MindMap } from '../../types/graph';
import { nodesApi } from '../../api/nodes.api';
import { ApiError } from '../../api/client';
import { getCurrentViewportCenter } from '../graph/viewportCenter';

interface Props {
  maps: MindMap[];
  currentMapId: string | null;
  onSelectMap: (mapId: string) => void;
  onCreateMap: (name: string) => void;
  onDeleteMap: (mapId: string) => void;
  graph: GraphData | null;
  onNodeAdded: () => void;
  onOpenCategories: () => void;
  onOpenRelationTypes: () => void;
  onOpenTags: () => void;
  onOpenShare: () => void;
  canEdit: boolean;
  isOwner: boolean;
}

export default function Toolbar({
  maps,
  currentMapId,
  onSelectMap,
  onCreateMap,
  onDeleteMap,
  graph,
  onNodeAdded,
  onOpenCategories,
  onOpenRelationTypes,
  onOpenTags,
  onOpenShare,
  canEdit,
  isOwner
}: Props) {
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeCategoryId, setNewNodeCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewMap, setShowNewMap] = useState(false);
  const [newMapName, setNewMapName] = useState('');

  const handleAddNode = async () => {
    if (!currentMapId) return;
    if (!newNodeName.trim()) {
      setError('Enter a node name.');
      return;
    }
    try {
      // Place at the current viewport center (with light jitter so repeated
      // adds don't stack exactly) so the new node is always visible right
      // away - the array-index grid fallback in graphAdapter.ts otherwise
      // lands off-screen once the map has been dragged into a real layout.
      const center = getCurrentViewportCenter();
      const jitter = () => Math.random() * 80 - 40;
      await nodesApi.create(currentMapId, {
        categoryId: newNodeCategoryId || null,
        name: newNodeName.trim(),
        posX: center ? center.x + jitter() : undefined,
        posY: center ? center.y + jitter() : undefined
      });
      setNewNodeName('');
      setShowAddNode(false);
      setError(null);
      onNodeAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add node');
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <select value={currentMapId ?? ''} onChange={(e) => onSelectMap(e.target.value)}>
          <option value="" disabled>
            Select a map...
          </option>
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button className="action-btn" onClick={() => setShowNewMap((v) => !v)}>
          + New Map
        </button>
        {currentMapId && canEdit && (
          <button
            className="action-btn danger"
            onClick={() => {
              const map = maps.find((m) => m.id === currentMapId);
              if (window.confirm(`Delete "${map?.name ?? 'this map'}"? This cannot be undone.`)) {
                onDeleteMap(currentMapId);
              }
            }}
          >
            🗑 Delete Map
          </button>
        )}
        {currentMapId && isOwner && (
          <button className="action-btn" onClick={onOpenShare}>
            👥 Share
          </button>
        )}
        {showNewMap && (
          <span className="inline-form">
            <input
              autoFocus
              placeholder="Map name"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !newMapName.trim()) return;
                onCreateMap(newMapName.trim());
                setNewMapName('');
                setShowNewMap(false);
              }}
            />
            <button
              className="action-btn"
              onClick={() => {
                if (!newMapName.trim()) return;
                onCreateMap(newMapName.trim());
                setNewMapName('');
                setShowNewMap(false);
              }}
            >
              Create
            </button>
          </span>
        )}
      </div>

      {currentMapId && canEdit && (
        <div className="toolbar-group">
          <button className="action-btn" onClick={onOpenCategories}>
            ⚙ Categories
          </button>
          <button className="action-btn" onClick={onOpenRelationTypes}>
            ⚙ Relation Types
          </button>
          <button className="action-btn" onClick={onOpenTags}>
            🏷 Tags
          </button>
          <button className="action-btn" onClick={() => setShowAddNode((v) => !v)}>
            + Add Node
          </button>
        </div>
      )}

      {showAddNode && canEdit && graph && (
        <div className="inline-form">
          <input
            autoFocus
            placeholder="Node name"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
          />
          <select value={newNodeCategoryId} onChange={(e) => setNewNodeCategoryId(e.target.value)}>
            <option value="">No category</option>
            {graph.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <button className="action-btn" onClick={handleAddNode}>
            Save
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
