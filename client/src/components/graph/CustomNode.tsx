import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { ApiError } from '../../api/client';
import type { RFEntityNode } from './graphAdapter';
import { useNodeInteraction } from './NodeInteractionContext';

export default function CustomNode({ id, data, selected }: NodeProps<RFEntityNode>) {
  const { categories, onQuickAdd, canEdit } = useNodeInteraction();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(data.categoryId ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleQuickAdd = async () => {
    if (!name.trim()) return;
    try {
      await onQuickAdd(id, { name: name.trim(), categoryId: categoryId || null });
      setName('');
      setError(null);
      setShowQuickAdd(false);
    } catch (err) {
      // Only close/clear on success - on failure the popover stays open with the
      // error visible, so a failed add is never mistaken for silently doing nothing.
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to add node');
    }
  };

  return (
    <div
      className={`flow-node${selected ? ' flow-node-selected' : ''}`}
      style={{ borderColor: data.color }}
    >
      {/* Four connection points with a fixed in/out convention (mirrors mindmup's
          top-down tree plus left-right pairing): top/left always receive a wire,
          bottom/right always send one. Which pair you actually drag from is stored
          per-edge (sourceHandle/targetHandle), so reloading never collapses an
          edge back onto the wrong handle. */}
      <Handle type="target" position={Position.Top} id="top" className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <span className="flow-node-icon">{data.icon}</span>
      <span className="flow-node-name">{data.name}</span>

      {selected && canEdit && (
        <button
          className="flow-node-quick-add"
          title="Add connected node"
          onClick={(e) => {
            e.stopPropagation();
            setError(null);
            setShowQuickAdd((v) => !v);
          }}
        >
          +
        </button>
      )}

      {showQuickAdd && (
        <div className="flow-quick-add-popover" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            placeholder="Node name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
          />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <button className="action-btn" onClick={handleQuickAdd}>
            Add
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}
    </div>
  );
}
