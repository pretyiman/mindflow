import { api } from './client';

export type CollaboratorRole = 'VIEWER' | 'EDITOR';

export interface Collaborator {
  id: string;
  mapId: string;
  role: CollaboratorRole;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

export const collaboratorsApi = {
  list: (mapId: string) => api.get<Collaborator[]>(`/maps/${mapId}/collaborators`),
  invite: (mapId: string, data: { email: string; role: CollaboratorRole }) =>
    api.post<Collaborator>(`/maps/${mapId}/collaborators`, data),
  updateRole: (id: string, role: CollaboratorRole) =>
    api.patch<Collaborator>(`/collaborators/${id}`, { role }),
  remove: (id: string) => api.delete<void>(`/collaborators/${id}`)
};
