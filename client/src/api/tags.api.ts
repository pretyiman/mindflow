import { api } from './client';
import type { Tag } from '../types/graph';

export const tagsApi = {
  list: (mapId: string) => api.get<Tag[]>(`/maps/${mapId}/tags`),
  create: (mapId: string, data: { name: string; color?: string }) =>
    api.post<Tag>(`/maps/${mapId}/tags`, data),
  update: (id: string, data: Partial<{ name: string; color: string }>) =>
    api.patch<Tag>(`/tags/${id}`, data),
  remove: (id: string, force = false) => api.delete<void>(`/tags/${id}${force ? '?force=true' : ''}`),
  setNodeTags: (nodeId: string, tagIds: string[]) =>
    api.put<{ nodeId: string; tagIds: string[] }>(`/nodes/${nodeId}/tags`, { tagIds })
};
