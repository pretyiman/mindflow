import { useState } from 'react';
import type { GraphData } from '../../types/graph';
import { useGraphStore } from '../../state/graphStore';
import { allPropertyKeys, filterGraph, isFilterActive } from '../graph/filterGraph';

interface Props {
  graph: GraphData;
}

export default function FilterPanel({ graph }: Props) {
  const {
    selectedTagIds,
    toggleFilterTag,
    propertyFilterKey,
    propertyFilterValue,
    setPropertyFilter,
    connectedToNodeId,
    setConnectedToNodeId,
    clearFilters
  } = useGraphStore();

  const [showTagPicker, setShowTagPicker] = useState(false);

  const filterState = { selectedTagIds, propertyFilterKey, propertyFilterValue, connectedToNodeId };
  const active = isFilterActive(filterState);
  const matchCount = active ? filterGraph(graph, filterState).size : graph.nodes.length;
  const propertyKeys = allPropertyKeys(graph);
  const selectedTags = graph.tags.filter((t) => selectedTagIds.includes(t.id));
  const connectableNodes = graph.nodes;

  if (graph.tags.length === 0 && propertyKeys.length === 0 && graph.nodes.length === 0) return null;

  return (
    <div className="filter-popover" onClick={(e) => e.stopPropagation()}>
      {graph.tags.length > 0 && (
        <div className="filter-tag-control">
          <button className="action-btn" onClick={() => setShowTagPicker((v) => !v)}>
            🏷 Tags{selectedTagIds.length > 0 ? ` (${selectedTagIds.length})` : ''}
          </button>
          {/* Selected tags always show as removable chips even when the picker is
              collapsed, so an active filter stays visible without listing every tag. */}
          {selectedTags.length > 0 && (
            <div className="tag-chip-list">
              {selectedTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="tag-chip tag-chip-active"
                  style={{ background: t.color, borderColor: t.color }}
                  onClick={() => toggleFilterTag(t.id)}
                  title="Click to remove from filter"
                >
                  {t.name} ✕
                </button>
              ))}
            </div>
          )}
          {showTagPicker && (
            <div className="filter-tag-popover">
              <div className="tag-chip-list">
                {graph.tags.map((t) => {
                  const isSelected = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tag-chip${isSelected ? ' tag-chip-active' : ''}`}
                      style={
                        isSelected ? { background: t.color, borderColor: t.color } : { borderColor: t.color }
                      }
                      onClick={() => toggleFilterTag(t.id)}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {propertyKeys.length > 0 && (
        <>
          <select
            value={propertyFilterKey}
            onChange={(e) => setPropertyFilter(e.target.value, propertyFilterValue)}
          >
            <option value="">Property...</option>
            {propertyKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            placeholder="value contains..."
            value={propertyFilterValue}
            onChange={(e) => setPropertyFilter(propertyFilterKey, e.target.value)}
            style={{ width: 130 }}
          />
        </>
      )}

      {connectableNodes.length > 0 && (
        <select value={connectedToNodeId ?? ''} onChange={(e) => setConnectedToNodeId(e.target.value || null)}>
          <option value="">Connected to...</option>
          {connectableNodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      )}

      {active && (
        <button className="action-btn" onClick={clearFilters}>
          Clear filters
        </button>
      )}

      <span className="filter-panel-count">
        {matchCount} of {graph.nodes.length} match
      </span>
    </div>
  );
}
