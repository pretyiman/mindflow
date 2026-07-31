import { z } from 'zod';

export const createMapSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional()
});

export const updateMapSchema = createMapSchema.partial();
