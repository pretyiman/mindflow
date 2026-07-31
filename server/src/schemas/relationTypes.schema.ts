import { z } from 'zod';

export const createRelationTypeSchema = z.object({
  name: z.string().min(1).max(100),
  isDirectional: z.boolean().optional(),
  isHierarchy: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  maxOutgoingPerSource: z.number().int().positive().nullable().optional(),
  maxIncomingPerTarget: z.number().int().positive().nullable().optional()
});

export const updateRelationTypeSchema = createRelationTypeSchema.partial();
