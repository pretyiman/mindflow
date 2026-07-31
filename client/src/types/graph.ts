export interface MindMap {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodeCategory {
  id: string;
  mapId: string;
  name: string;
  icon: string;
  color: string;
}

export interface RelationType {
  id: string;
  mapId: string;
  name: string;
  isDirectional: boolean;
  isHierarchy: boolean;
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  maxOutgoingPerSource: number | null;
  maxIncomingPerTarget: number | null;
}

export type PropertyValue = string | number | boolean | null;

export interface Tag {
  id: string;
  mapId: string;
  name: string;
  color: string;
}

export interface GraphNode {
  id: string;
  mapId: string;
  categoryId: string | null;
  name: string;
  iconOverride: string | null;
  colorOverride: string | null;
  notes: string;
  properties: Record<string, PropertyValue>;
  // Absolute canvas position when ungrouped; relative to the parent group's own
  // posX/posY when groupId is set (matches React Flow's parent/child convention).
  posX: number | null;
  posY: number | null;
  tagIds: string[];
  groupId: string | null;
}

export interface NodeGroup {
  id: string;
  mapId: string;
  name: string;
  color: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

export type HandleId = 'top' | 'bottom' | 'left' | 'right';

export interface GraphEdge {
  id: string;
  mapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationTypeId: string;
  labelOverride: string | null;
  properties: Record<string, PropertyValue>;
  sourceHandle: HandleId | null;
  targetHandle: HandleId | null;
  colorOverride: string | null;
  lineStyleOverride: 'solid' | 'dashed' | 'dotted' | null;
  widthOverride: number | null;
}

export interface GraphData {
  categories: NodeCategory[];
  relationTypes: RelationType[];
  tags: Tag[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: NodeGroup[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
