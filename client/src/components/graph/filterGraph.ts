import type { GraphData } from '../../types/graph';

export interface FilterState {
  selectedTagIds: string[];
  propertyFilterKey: string;
  propertyFilterValue: string;
  connectedToNodeId: string | null;
}

export function isFilterActive(filter: FilterState): boolean {
  return (
    filter.selectedTagIds.length > 0 ||
    (filter.propertyFilterKey.trim() !== '' && filter.propertyFilterValue.trim() !== '') ||
    filter.connectedToNodeId !== null
  );
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  return new Set([...a].filter((x) => b.has(x)));
}

/**
 * Adjacency map for "connected to" tracing: every edge counts as a link in
 * both directions, and being in the same group counts as a link too (so
 * tracing through one half of a couple pulls in the other half's own
 * connections as well, not just their shared children).
 */
function buildNeighborMap(data: GraphData): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };
  for (const edge of data.edges) {
    link(edge.sourceNodeId, edge.targetNodeId);
    link(edge.targetNodeId, edge.sourceNodeId);
  }
  const byGroup = new Map<string, string[]>();
  for (const node of data.nodes) {
    if (!node.groupId) continue;
    const list = byGroup.get(node.groupId) ?? [];
    list.push(node.id);
    byGroup.set(node.groupId, list);
  }
  for (const members of byGroup.values()) {
    for (const a of members) for (const b of members) if (a !== b) link(a, b);
  }
  return map;
}

/**
 * Pure client-side filter over the already-fetched graph - no backend query
 * language needed since the whole map is already in memory. Combines tag,
 * property, and connection filters with AND; each dimension itself is an OR
 * (e.g. matching ANY selected tag).
 */
export function filterGraph(data: GraphData, filter: FilterState): Set<string> {
  const allIds = new Set(data.nodes.map((n) => n.id));
  if (!isFilterActive(filter)) return allIds;

  let matched = allIds;

  if (filter.selectedTagIds.length > 0) {
    const tagMatch = new Set(
      data.nodes.filter((n) => n.tagIds.some((id) => filter.selectedTagIds.includes(id))).map((n) => n.id)
    );
    matched = intersect(matched, tagMatch);
  }

  if (filter.propertyFilterKey.trim() && filter.propertyFilterValue.trim()) {
    const key = filter.propertyFilterKey;
    const needle = filter.propertyFilterValue.toLowerCase();
    const propMatch = new Set(
      data.nodes
        .filter((n) => {
          const value = n.properties[key];
          return value != null && String(value).toLowerCase().includes(needle);
        })
        .map((n) => n.id)
    );
    matched = intersect(matched, propMatch);
  }

  if (filter.connectedToNodeId) {
    // Bounded trace: the selected node, its neighbors, and their neighbors -
    // 2 hops out in every direction (either edge direction, plus group
    // membership).
    const CONNECTION_DEPTH = 2;
    const neighborMap = buildNeighborMap(data);
    const visited = new Set<string>([filter.connectedToNodeId]);
    let frontier = [filter.connectedToNodeId];
    for (let hop = 0; hop < CONNECTION_DEPTH && frontier.length > 0; hop++) {
      const nextFrontier: string[] = [];
      for (const current of frontier) {
        for (const next of neighborMap.get(current) ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            nextFrontier.push(next);
          }
        }
      }
      frontier = nextFrontier;
    }

    matched = intersect(matched, visited);
  }

  return matched;
}

/** Union of all property keys present across the map's nodes, for the filter dropdown. */
export function allPropertyKeys(data: GraphData): string[] {
  const keys = new Set<string>();
  for (const node of data.nodes) {
    for (const key of Object.keys(node.properties)) keys.add(key);
  }
  return [...keys].sort();
}
