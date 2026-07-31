import { z } from 'zod';

export const createNodeSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  iconOverride: z.string().max(20).nullable().optional(),
  colorOverride: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  notes: z.string().max(20000).optional(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  posX: z.number().nullable().optional(),
  posY: z.number().nullable().optional()
});

export const updateNodeSchema = createNodeSchema.partial();
