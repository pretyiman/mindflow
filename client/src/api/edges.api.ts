import { api } from './client';
import type { GraphEdge, HandleId, PropertyValue } from '../types/graph';

type EdgeInput = {
  sourceNodeId: string;
  targetNodeId: string;
  relationTypeId: string;
  labelOverride?: string | null;
  properties?: Record<string, PropertyValue>;
  sourceHandle?: HandleId | null;
  targetHandle?: HandleId | null;
  colorOverride?: string | null;
  lineStyleOverride?: 'solid' | 'dashed' | 'dotted' | null;
  widthOverride?: number | null;
};

type EdgeUpdateInput = Pick<
  EdgeInput,
  'labelOverride' | 'properties' | 'colorOverride' | 'lineStyleOverride' | 'widthOverride'
>;

export const edgesApi = {
  list: (mapId: string) => api.get<GraphEdge[]>(`/maps/${mapId}/edges`),
  create: (mapId: string, data: EdgeInput) => api.post<GraphEdge>(`/maps/${mapId}/edges`, data),
  update: (id: string, data: Partial<EdgeUpdateInput>) => api.patch<GraphEdge>(`/edges/${id}`, data),
  remove: (id: string) => api.delete<void>(`/edges/${id}`)
};
