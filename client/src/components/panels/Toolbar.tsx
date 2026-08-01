import { useState } from 'react';
import type { GraphData } from '../../types/graph';
import { useGraphStore } from '../../state/graphStore';
import { isFilterActive, filterGraph } from '../graph/filterGraph';
import FilterPanel from './FilterPanel';

interface Props {
  mapName: string;
  onBack: () => void;
  graph: GraphData | null;
}

export default function Toolbar({ mapName, onBack, graph }: Props) {
  const [showFilter, setShowFilter] = useState(false);

  const { selectedTagIds, propertyFilterKey, propertyFilterValue, connectedToNodeId } = useGraphStore();
  const filterState = { selectedTagIds, propertyFilterKey, propertyFilterValue, connectedToNodeId };
  const filterActive = isFilterActive(filterState);
  const matchCount = graph && filterActive ? filterGraph(graph, filterState).size : null;

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="back-btn" onClick={onBack} title="Back to your maps">
          ← Maps
        </button>
        <h1 className="board-title">{mapName}</h1>
      </div>

      {graph && (
        <div className="toolbar-group">
          <div className="filter-trigger-wrap">
            <button
              className={`icon-tool-btn${filterActive ? ' icon-tool-btn-active' : ''}`}
              onClick={() => setShowFilter((v) => !v)}
              title={filterActive && matchCount !== null ? `Filter (${matchCount}/${graph.nodes.length})` : 'Filter'}
            >
              🔍
              {filterActive && <span className="icon-tool-dot" />}
            </button>
            {showFilter && (
              <>
                <div className="row-menu-scrim" onClick={() => setShowFilter(false)} />
                <FilterPanel graph={graph} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
