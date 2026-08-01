import { api } from './client';
import type { CollaboratorRole } from './collaborators.api';

export interface InviteInfo {
  mapId: string;
  mapName: string;
  role: CollaboratorRole;
  accepted: boolean;
}

export const invitesApi = {
  get: (token: string) => api.get<InviteInfo>(`/invites/${token}`),
  accept: (token: string) => api.post<{ mapId: string }>(`/invites/${token}/accept`),
  remove: (id: string) => api.delete<void>(`/invites/${id}`)
};
