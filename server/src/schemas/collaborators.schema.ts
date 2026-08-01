import { z } from 'zod';

export const inviteCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['VIEWER', 'EDITOR'])
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(['VIEWER', 'EDITOR'])
});
