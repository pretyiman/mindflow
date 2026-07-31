import { useState } from 'react';
import Modal from '../common/Modal';
import type { GraphData } from '../../types/graph';
import { tagsApi } from '../../api/tags.api';
import { ApiError } from '../../api/client';

interface Props {
  mapId: string;
  graph: GraphData;
  onClose: () => void;
  onChanged: () => void;
}

export default function ManageTagsModal({ mapId, graph, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#5577aa');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await tagsApi.create(mapId, { name: name.trim(), color });
      setName('');
      setError(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create tag');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tagsApi.remove(id);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const details = err.details as { nodeCount?: number } | undefined;
        const confirmed = window.confirm(
          `${err.message} Delete anyway? This removes the tag from ${details?.nodeCount ?? 'all'} node(s) (the nodes themselves are not affected).`
        );
        if (confirmed) {
          await tagsApi.remove(id, true);
          onChanged();
        }
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Failed to delete tag');
    }
  };

  return (
    <Modal title="Manage Tags" onClose={onClose}>
      {graph.tags.length === 0 && (
        <p className="hint-text">
          Create your first tag for grouping/filtering (e.g. "friends of Cris", "table:users",
          "PII") - unlike categories, a node can carry any number of tags and tags have no effect
          on how a node looks.
        </p>
      )}
      <table className="manage-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Color</th>
            <th>Nodes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {graph.tags.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>
                <span className="color-swatch" style={{ background: t.color }} />
              </td>
              <td>{graph.nodes.filter((n) => n.tagIds.includes(t.id)).length}</td>
              <td>
                <button className="icon-btn" onClick={() => handleDelete(t.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-form">
        <input placeholder="Tag name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button className="action-btn" onClick={handleCreate}>
          + Add Tag
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
