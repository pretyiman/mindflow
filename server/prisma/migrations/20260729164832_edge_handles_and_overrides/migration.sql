-- Records which specific connection point (top/bottom/left/right) an edge uses on
-- each side, so reloading the graph doesn't collapse ambiguous multi-handle nodes
-- back to a default handle. Also adds per-edge visual overrides (color/line style/
-- width) so two edges of the same relation type can still be told apart visually,
-- mirroring the existing icon_override/color_override pattern on nodes.
ALTER TABLE "edges"
  ADD COLUMN "source_handle" TEXT,
  ADD COLUMN "target_handle" TEXT,
  ADD COLUMN "color_override" TEXT,
  ADD COLUMN "line_style_override" TEXT,
  ADD COLUMN "width_override" DOUBLE PRECISION;
