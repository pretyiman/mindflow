import { api } from './client';
import type { GraphData, MindMap } from '../types/graph';

export const mapsApi = {
  list: () => api.get<MindMap[]>('/maps'),
  create: (data: { name: string; description?: string }) => api.post<MindMap>('/maps', data),
  get: (id: string) => api.get<MindMap>(`/maps/${id}`),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<MindMap>(`/maps/${id}`, data),
  remove: (id: string) => api.delete<void>(`/maps/${id}`),
  graph: (id: string) => api.get<GraphData>(`/maps/${id}/graph`)
};
