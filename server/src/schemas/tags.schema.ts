import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()
});

export const updateTagSchema = createTagSchema.partial();

export const setNodeTagsSchema = z.object({
  tagIds: z.array(z.string().uuid())
});
