-- Replaces the union-connector mechanism (auto-created connector node between two
-- nodes) with a lighter opt-in visual join: two ordinary edges that already share a
-- target can be tagged with the same merge_group_id to render as one fused trunk
-- instead of two separate lines converging on the child. No extra node involved.
ALTER TABLE "edges" ADD COLUMN "merge_group_id" TEXT;

ALTER TABLE "relation_types" DROP COLUMN "is_union";
ALTER TABLE "nodes" DROP COLUMN "is_connector";
