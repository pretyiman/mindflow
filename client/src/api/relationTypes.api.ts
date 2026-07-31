import { api } from './client';
import type { RelationType } from '../types/graph';

type RelationTypeInput = {
  name: string;
  isDirectional?: boolean;
  isHierarchy?: boolean;
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  maxOutgoingPerSource?: number | null;
  maxIncomingPerTarget?: number | null;
};

export const relationTypesApi = {
  list: (mapId: string) => api.get<RelationType[]>(`/maps/${mapId}/relation-types`),
  create: (mapId: string, data: RelationTypeInput) =>
    api.post<RelationType>(`/maps/${mapId}/relation-types`, data),
  update: (id: string, data: Partial<RelationTypeInput>) =>
    api.patch<RelationType>(`/relation-types/${id}`, data),
  remove: (id: string, force = false) =>
    api.delete<void>(`/relation-types/${id}${force ? '?force=true' : ''}`)
};
