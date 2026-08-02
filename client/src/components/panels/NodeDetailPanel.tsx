import { useEffect, useState } from 'react';
import type { GraphData, PropertyValue } from '../../types/graph';
import { nodesApi } from '../../api/nodes.api';
import { edgesApi } from '../../api/edges.api';
import { tagsApi } from '../../api/tags.api';
import { groupsApi } from '../../api/groups.api';
import { categoriesApi } from '../../api/categories.api';
import { ApiError } from '../../api/client';
import { CATEGORY_ICON_CHOICES } from '../../constants/categoryIcons';

interface Props {
  graph: GraphData;
  selectedNodeId: string | null;
  onClose: () => void;
  onChanged: () => void;
  canEdit: boolean;
}

export default function NodeDetailPanel({ graph, selectedNodeId, onClose, onChanged, canEdit }: Props) {
  const node = graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const group = !node ? (graph.groups.find((g) => g.id === selectedNodeId) ?? null) : null;
  const category = node ? graph.categories.find((c) => c.id === node.categoryId) : null;

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [properties, setProperties] = useState<[string, PropertyValue][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingRelation, setAddingRelation] = useState(false);
  const [relationTargetId, setRelationTargetId] = useState('');
  const [relationTypeId, setRelationTypeId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState('#4a4a6a');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [newCatColor, setNewCatColor] = useState('#5577aa');
  const [newCatError, setNewCatError] = useState<string | null>(null);

  useEffect(() => {
    setName(node?.name ?? '');
    setNotes(node?.notes ?? '');
    setProperties(node ? Object.entries(node.properties) : []);
    setError(null);
    setAddingRelation(false);
  }, [node?.id]);

  useEffect(() => {
    setGroupName(group?.name ?? '');
    setGroupColor(group?.color ?? '#4a4a6a');
  }, [group?.id]);

  const memberCount = group ? graph.nodes.filter((n) => n.groupId === group.id).length : 0;

  const handleSaveGroupName = async () => {
    if (!group || groupName === group.name) return;
    await groupsApi.update(group.id, { name: groupName });
    onChanged();
  };

  const handleSaveGroupColor = async (color: string) => {
    if (!group) return;
    setGroupColor(color);
    await groupsApi.update(group.id, { color });
    onChanged();
  };

  const handleUngroup = async () => {
    if (!group) return;
    await groupsApi.remove(group.id);
    onChanged();
    onClose();
  };

  if (group) {
    return (
      <div className="detail-panel">
        <h2>
          <input
            className="name-input"
            placeholder="Group name (optional)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onBlur={handleSaveGroupName}
            disabled={!canEdit}
          />
        </h2>
        <div className="property">
          <label>Color</label>
          <input
            type="color"
            value={groupColor}
            onChange={(e) => handleSaveGroupColor(e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <p className="hint-text">
          {memberCount} node{memberCount === 1 ? '' : 's'} in this group. Each keeps its own identity, notes
          and connections - this box is purely visual, so you can drag them as one unit.
        </p>
        {canEdit && (
          <div className="actions">
            <button className="action-btn danger" onClick={handleUngroup}>
              ⊟ Ungroup
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!node) {
    return (
      <div className="detail-panel">
        <h2>Node Details</h2>
        <p>Click a node to see its details, notes, and properties.</p>
      </div>
    );
  }

  const propertiesAsRecord = (): Record<string, PropertyValue> =>
    Object.fromEntries(properties.filter(([key]) => key.trim().length > 0));

  const handleSaveName = async () => {
    if (name === node.name) return;
    await nodesApi.update(node.id, { name });
    onChanged();
  };

  const handleSaveNotes = async () => {
    if (notes === node.notes) return;
    await nodesApi.update(node.id, { notes });
    onChanged();
  };

  const handleSaveProperties = async () => {
    await nodesApi.update(node.id, { properties: propertiesAsRecord() });
    onChanged();
  };

  const handleCategoryChange = async (categoryId: string | null) => {
    await nodesApi.update(node.id, { categoryId });
    onChanged();
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await categoriesApi.create(node.mapId, {
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor
      });
      setNewCatName('');
      setNewCatError(null);
      setShowNewCategory(false);
      await nodesApi.update(node.id, { categoryId: created.id });
      onChanged();
    } catch (err) {
      setNewCatError(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  };

  const handleToggleTag = async (tagId: string) => {
    const nextTagIds = node.tagIds.includes(tagId)
      ? node.tagIds.filter((id) => id !== tagId)
      : [...node.tagIds, tagId];
    await tagsApi.setNodeTags(node.id, nextTagIds);
    onChanged();
  };

  const handleDelete = async () => {
    await nodesApi.remove(node.id);
    onChanged();
    onClose();
  };

  const handleAddRelation = async () => {
    if (!relationTypeId) {
      setError('Pick a relation type.');
      return;
    }
    if (!relationTargetId) {
      setError('Pick a target node.');
      return;
    }
    try {
      await edgesApi.create(node.mapId, {
        sourceNodeId: node.id,
        targetNodeId: relationTargetId,
        relationTypeId
      });
      setAddingRelation(false);
      setRelationTargetId('');
      setRelationTypeId('');
      setError(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add relation');
    }
  };

  return (
    <div className="detail-panel">
      <h2>
        {node.iconOverride ?? category?.icon ?? '❓'}{' '}
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSaveName}
          disabled={!canEdit}
        />
      </h2>

      <div className="property">
        <label>Category</label>
        <div className="category-select-row">
          <select
            value={node.categoryId ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value || null)}
            disabled={!canEdit}
          >
            <option value="">No category</option>
            {graph.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {canEdit && (
            <div className="category-create-wrap">
              <button
                className="category-add-btn"
                onClick={() => setShowNewCategory((v) => !v)}
                title="Create new category"
              >
                +
              </button>
              {showNewCategory && (
                <>
                  <div className="row-menu-scrim" onClick={() => setShowNewCategory(false)} />
                  <div className="category-create-popover">
                    <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)}>
                      {CATEGORY_ICON_CHOICES.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                    <input
                      autoFocus
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                    />
                    <button className="action-btn" onClick={handleCreateCategory}>
                      Create
                    </button>
                    {newCatError && <p className="error-text">{newCatError}</p>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="property">
        <label>Tags</label>
        {graph.tags.length === 0 ? (
          <p className="hint-text">No tags yet - create some in the Tags settings.</p>
        ) : (
          <div className="tag-chip-list">
            {graph.tags.map((t) => {
              const active = node.tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`tag-chip${active ? ' tag-chip-active' : ''}`}
                  style={active ? { background: t.color, borderColor: t.color } : { borderColor: t.color }}
                  onClick={() => handleToggleTag(t.id)}
                  disabled={!canEdit}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="property">
        <label>Properties</label>
        {properties.map(([key, value], idx) => (
          <div className="property-row" key={idx}>
            <input
              placeholder="key"
              value={key}
              onChange={(e) => {
                const next = [...properties];
                next[idx] = [e.target.value, value];
                setProperties(next);
              }}
              onBlur={handleSaveProperties}
              disabled={!canEdit}
            />
            <input
              placeholder="value"
              value={value === null ? '' : String(value)}
              onChange={(e) => {
                const next = [...properties];
                next[idx] = [key, e.target.value];
                setProperties(next);
              }}
              onBlur={handleSaveProperties}
              disabled={!canEdit}
            />
            {canEdit && (
              <button
                className="icon-btn"
                onClick={() => {
                  const next = properties.filter((_, i) => i !== idx);
                  setProperties(next);
                  nodesApi
                    .update(node.id, { properties: Object.fromEntries(next) })
                    .then(onChanged);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <button className="action-btn" onClick={() => setProperties([...properties, ['', '']])}>
            + Add property
          </button>
        )}
      </div>

      <div className="property">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Add detailed notes, specs, experience..."
          rows={6}
          disabled={!canEdit}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      {canEdit && (
        <div className="actions">
          <button
            className="action-btn"
            onClick={() =>
              setAddingRelation((v) => {
                const next = !v;
                if (next && !relationTypeId && graph.relationTypes.length) {
                  setRelationTypeId(graph.relationTypes[0].id);
                }
                return next;
              })
            }
          >
            🔗 Add Relation
          </button>
          <button className="action-btn danger" onClick={handleDelete}>
            🗑 Delete
          </button>
        </div>
      )}

      {canEdit && addingRelation && (
        <div className="add-relation-form">
          {graph.relationTypes.length === 0 ? (
            <p className="hint-text">Create a relation type first (Relation Types in the toolbar).</p>
          ) : (
            <>
              <select value={relationTypeId} onChange={(e) => setRelationTypeId(e.target.value)}>
                <option value="">Relation type...</option>
                {graph.relationTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
              <select value={relationTargetId} onChange={(e) => setRelationTargetId(e.target.value)}>
                <option value="">Target node...</option>
                {graph.nodes
                  .filter((n) => n.id !== node.id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
              </select>
              <button className="action-btn" onClick={handleAddRelation}>
                Save relation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
