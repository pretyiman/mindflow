-- Drop the single-canonical-parent column. This existed only to support the
-- old 3D force-layout's "hierarchy edges dominate the simulation" trick; with
-- manual 2D positioning there's no physics layout to dominate, and a single
-- parent_id actively prevents "child belongs to both parents" scenarios.
-- No data loss: every node with a parent_id already has a matching hierarchy
-- edge row in `edges` (created by the old sync logic), which remains intact.
ALTER TABLE "nodes" DROP COLUMN "parent_id";
