import { api } from './client';
import type { NodeGroup } from '../types/graph';

export const groupsApi = {
  create: (mapId: string, data: { nodeIds: string[]; name?: string; color?: string }) =>
    api.post<NodeGroup>(`/maps/${mapId}/groups`, data),
  update: (
    id: string,
    data: Partial<{ name: string; color: string; posX: number; posY: number; width: number; height: number }>
  ) => api.patch<NodeGroup>(`/groups/${id}`, data),
  remove: (id: string) => api.delete<void>(`/groups/${id}`)
};
