import { api } from './client';
import type { NodeCategory } from '../types/graph';

export const categoriesApi = {
  list: (mapId: string) => api.get<NodeCategory[]>(`/maps/${mapId}/categories`),
  create: (mapId: string, data: { name: string; icon?: string; color?: string }) =>
    api.post<NodeCategory>(`/maps/${mapId}/categories`, data),
  update: (id: string, data: Partial<{ name: string; icon: string; color: string }>) =>
    api.patch<NodeCategory>(`/categories/${id}`, data),
  remove: (id: string, force = false) =>
    api.delete<void>(`/categories/${id}${force ? '?force=true' : ''}`)
};
