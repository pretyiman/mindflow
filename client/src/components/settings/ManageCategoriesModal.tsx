import { useState } from 'react';
import Modal from '../common/Modal';
import type { GraphData } from '../../types/graph';
import { categoriesApi } from '../../api/categories.api';
import { ApiError } from '../../api/client';

interface Props {
  mapId: string;
  graph: GraphData;
  onClose: () => void;
  onChanged: () => void;
}

const EMOJI_CHOICES = [
  '👤', '👨', '👩', '🧑', '👴', '👵', '👶', '👨‍🏫', '👩‍🏫', '🧑‍💻',
  '⚛️', '⚡', '🖼️', '🗄️', '🔌', '🐛', '🛡️', '🎯', '📄', '❓'
];

export default function ManageCategoriesModal({ mapId, graph, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJI_CHOICES[0]);
  const [color, setColor] = useState('#5577aa');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await categoriesApi.create(mapId, { name: name.trim(), icon, color });
      setName('');
      setError(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.remove(id);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const details = err.details as { nodeCount?: number } | undefined;
        const confirmed = window.confirm(
          `${err.message} Delete anyway? ${details?.nodeCount ?? 'All'} node(s) using it will become uncategorized (they are not deleted).`
        );
        if (confirmed) {
          await categoriesApi.remove(id, true);
          onChanged();
        }
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Failed to delete category');
    }
  };

  return (
    <Modal title="Manage Categories" onClose={onClose}>
      {graph.categories.length === 0 && (
        <p className="hint-text">
          Create your first category (e.g. Person, Component, Vulnerability...).
        </p>
      )}
      <table className="manage-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Name</th>
            <th>Color</th>
            <th>Nodes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {graph.categories.map((c) => (
            <tr key={c.id}>
              <td>{c.icon}</td>
              <td>{c.name}</td>
              <td>
                <span className="color-swatch" style={{ background: c.color }} />
              </td>
              <td>{graph.nodes.filter((n) => n.categoryId === c.id).length}</td>
              <td>
                <button className="icon-btn" onClick={() => handleDelete(c.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-form">
        <select value={icon} onChange={(e) => setIcon(e.target.value)}>
          {EMOJI_CHOICES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button className="action-btn" onClick={handleCreate}>
          + Add Category
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
