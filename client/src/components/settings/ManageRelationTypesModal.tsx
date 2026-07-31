import { useState } from 'react';
import Modal from '../common/Modal';
import type { GraphData } from '../../types/graph';
import { relationTypesApi } from '../../api/relationTypes.api';
import { ApiError } from '../../api/client';

interface Props {
  mapId: string;
  graph: GraphData;
  onClose: () => void;
  onChanged: () => void;
}

export default function ManageRelationTypesModal({ mapId, graph, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [isDirectional, setIsDirectional] = useState(true);
  const [isHierarchy, setIsHierarchy] = useState(false);
  const [color, setColor] = useState('#cccccc');
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await relationTypesApi.create(mapId, {
        name: name.trim(),
        isDirectional,
        isHierarchy,
        color,
        lineStyle
      });
      setName('');
      setError(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create relation type');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await relationTypesApi.remove(id);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const details = err.details as { edgeCount?: number } | undefined;
        const confirmed = window.confirm(
          `${err.message} Delete anyway? This removes ${details?.edgeCount ?? 'all'} edge(s).`
        );
        if (confirmed) {
          await relationTypesApi.remove(id, true);
          onChanged();
        }
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Failed to delete relation type');
    }
  };

  return (
    <Modal title="Manage Relation Types" onClose={onClose}>
      {graph.relationTypes.length === 0 && (
        <p className="hint-text">
          Create your first relation type (e.g. parent-of, teaches, depends-on...). Mark one as
          "hierarchy" to use it for parent/child structure.
        </p>
      )}
      <table className="manage-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Directional</th>
            <th>Hierarchy</th>
            <th>Color</th>
            <th>Style</th>
            <th>Edges</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {graph.relationTypes.map((rt) => (
            <tr key={rt.id}>
              <td>{rt.name}</td>
              <td>{rt.isDirectional ? 'Yes' : 'No'}</td>
              <td>{rt.isHierarchy ? 'Yes' : 'No'}</td>
              <td>
                <span className="color-swatch" style={{ background: rt.color }} />
              </td>
              <td>{rt.lineStyle}</td>
              <td>{graph.edges.filter((e) => e.relationTypeId === rt.id).length}</td>
              <td>
                <button className="icon-btn" onClick={() => handleDelete(rt.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-form">
        <input placeholder="Relation name" value={name} onChange={(e) => setName(e.target.value)} />
        <label>
          <input
            type="checkbox"
            checked={isDirectional}
            onChange={(e) => setIsDirectional(e.target.checked)}
          />
          Directional
        </label>
        <label>
          <input
            type="checkbox"
            checked={isHierarchy}
            onChange={(e) => setIsHierarchy(e.target.checked)}
          />
          Hierarchy
        </label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <select value={lineStyle} onChange={(e) => setLineStyle(e.target.value as typeof lineStyle)}>
          <option value="solid">solid</option>
          <option value="dashed">dashed</option>
          <option value="dotted">dotted</option>
        </select>
        <button className="action-btn" onClick={handleCreate}>
          + Add Relation Type
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
