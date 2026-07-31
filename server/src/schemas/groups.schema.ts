import { z } from 'zod';

export const createGroupSchema = z.object({
  nodeIds: z.array(z.string().uuid()).min(2),
  name: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()
});

export const updateGroupSchema = z.object({
  name: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional()
});
