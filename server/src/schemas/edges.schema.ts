import { z } from 'zod';

const HANDLE = z.enum(['top', 'bottom', 'left', 'right']).nullable().optional();
const LINE_STYLE_OVERRIDE = z.enum(['solid', 'dashed', 'dotted']).nullable().optional();

export const createEdgeSchema = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  relationTypeId: z.string().uuid(),
  labelOverride: z.string().max(200).nullable().optional(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  sourceHandle: HANDLE,
  targetHandle: HANDLE,
  colorOverride: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  lineStyleOverride: LINE_STYLE_OVERRIDE,
  widthOverride: z.number().positive().nullable().optional()
});

export const updateEdgeSchema = z.object({
  labelOverride: z.string().max(200).nullable().optional(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  colorOverride: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  lineStyleOverride: LINE_STYLE_OVERRIDE,
  widthOverride: z.number().positive().nullable().optional()
});
