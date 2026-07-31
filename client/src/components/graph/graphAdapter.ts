import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { GraphData, GraphNode, HandleId, NodeCategory, NodeGroup, RelationType } from '../../types/graph';

export interface RFNodeData extends Record<string, unknown> {
  name: string;
  icon: string;
  color: string;
  categoryId: string | null;
  raw: GraphNode;
}

export interface RFGroupData extends Record<string, unknown> {
  name: string;
  color: string;
  raw: NodeGroup;
}

export interface RFEdgeData extends Record<string, unknown> {
  label: string;
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  width: number;
  isDirectional: boolean;
}

export type RFEntityNode = Node<RFNodeData, 'entity'>;
export type RFGroupNode = Node<RFGroupData, 'group'>;
export type RFNode = RFEntityNode | RFGroupNode;
export type RFEdge = Edge<RFEdgeData, 'relation'>;

const GRID_COLUMNS = 5;
const GRID_SPACING_X = 220;
const GRID_SPACING_Y = 160;
const DEFAULT_EDGE_WIDTH = 2;

/** Deterministic fallback position for a node that has never been manually placed. */
function fallbackPosition(index: number): { x: number; y: number } {
  return {
    x: (index % GRID_COLUMNS) * GRID_SPACING_X,
    y: Math.floor(index / GRID_COLUMNS) * GRID_SPACING_Y
  };
}

/**
 * Pure DB-shape -> React Flow-shape converter. Denormalizes category icon/color
 * and relation-type color/style onto each node/edge so GraphCanvas never has to
 * look anything up mid-render and stays fully domain-agnostic. Positions are
 * never computed by physics - they come from the saved posX/posY, or a simple
 * grid fallback for nodes that have never been dragged/placed yet.
 */
export function toFlowGraph(data: GraphData): { nodes: RFNode[]; edges: RFEdge[] } {
  const categoryById = new Map<string, NodeCategory>(data.categories.map((c) => [c.id, c]));
  const relationTypeById = new Map<string, RelationType>(data.relationTypes.map((r) => [r.id, r]));

  // Group boxes must appear before their members in the array - React Flow
  // resolves parentId by node order on first render.
  const groupNodes: RFGroupNode[] = data.groups.map((group) => ({
    id: group.id,
    type: 'group',
    position: { x: group.posX, y: group.posY },
    style: { width: group.width, height: group.height },
    data: { name: group.name, color: group.color, raw: group }
  }));

  const entityNodes: RFEntityNode[] = data.nodes.map((node, index) => {
    const category = node.categoryId ? categoryById.get(node.categoryId) : undefined;
    const hasPosition = node.posX != null && node.posY != null;
    // A grouped node's posX/posY are already relative to its group (see
    // groups.service.ts) - exactly what React Flow expects for a child of
    // parentId, so no conversion is needed here.
    return {
      id: node.id,
      type: 'entity',
      position: hasPosition ? { x: node.posX as number, y: node.posY as number } : fallbackPosition(index),
      parentId: node.groupId ?? undefined,
      extent: node.groupId ? ('parent' as const) : undefined,
      data: {
        name: node.name,
        icon: node.iconOverride ?? category?.icon ?? '❓',
        color: node.colorOverride ?? category?.color ?? '#888888',
        categoryId: node.categoryId,
        raw: node
      }
    };
  });

  const edges: RFEdge[] = data.edges.map((edge) => {
    const relationType = relationTypeById.get(edge.relationTypeId);
    const isDirectional = relationType?.isDirectional ?? true;
    const color = edge.colorOverride ?? relationType?.color ?? '#cccccc';
    // Edges created before per-handle support (or via quick-add/API without a specific
    // drag) fall back to the same left/right convention the app used before 4 handles
    // existed, so old data keeps rendering exactly as it did.
    const sourceHandle: HandleId = edge.sourceHandle ?? 'right';
    const targetHandle: HandleId = edge.targetHandle ?? 'left';

    return {
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle,
      targetHandle,
      type: 'relation',
      markerEnd: isDirectional ? { type: MarkerType.ArrowClosed, color } : undefined,
      data: {
        label: edge.labelOverride ?? relationType?.name ?? '',
        color,
        lineStyle: edge.lineStyleOverride ?? relationType?.lineStyle ?? 'solid',
        width: edge.widthOverride ?? DEFAULT_EDGE_WIDTH,
        isDirectional
      }
    };
  });

  return { nodes: [...groupNodes, ...entityNodes], edges };
}
